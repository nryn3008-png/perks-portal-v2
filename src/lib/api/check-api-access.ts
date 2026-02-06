/**
 * API-Level Access Check
 *
 * Reads the `perks_access` cookie and `x-user-is-admin` header
 * to determine if the current request has access to perk data.
 *
 * Used in API route handlers to prevent unauthorized data access
 * even if the page-level check is bypassed.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { AccessStatus } from '@/types';

const ACCESS_COOKIE_NAME = 'perks_access';

/**
 * Decode access status from the base64-encoded cookie
 */
function decodeAccessCookie(value: string): AccessStatus | null {
  try {
    const json = Buffer.from(value, 'base64').toString('utf-8');
    const parsed = JSON.parse(json);

    if (typeof parsed.granted !== 'boolean' || !parsed.reason || !parsed.checkedAt) {
      return null;
    }

    return parsed as AccessStatus;
  } catch {
    return null;
  }
}

/**
 * Check if the current API request has access to perks data.
 *
 * Returns null if access is granted, or a 403 NextResponse if denied.
 * Usage in route handlers:
 *
 * ```ts
 * const denied = checkApiAccess(request);
 * if (denied) return denied;
 * ```
 */
export function checkApiAccess(request: NextRequest): NextResponse | null {
  // Admin bypass — middleware sets this header
  const isAdmin = request.headers.get('x-user-is-admin') === 'true';
  if (isAdmin) return null;

  // Read access cookie
  const accessCookie = request.cookies.get(ACCESS_COOKIE_NAME);

  if (!accessCookie?.value) {
    return NextResponse.json(
      { error: { code: 'ACCESS_DENIED', message: 'Access check required', status: 403 } },
      { status: 403 }
    );
  }

  const accessStatus = decodeAccessCookie(accessCookie.value);

  if (!accessStatus || !accessStatus.granted) {
    return NextResponse.json(
      { error: { code: 'ACCESS_DENIED', message: 'Access denied', status: 403 } },
      { status: 403 }
    );
  }

  // Access granted
  return null;
}
