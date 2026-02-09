/**
 * GET /api/access/status
 *
 * Returns the current access status from the `perks_access` cookie.
 * Used by the user menu to display access reason without client-side cookie parsing.
 */

import { NextResponse } from 'next/server';
import { accessService } from '@/lib/api/access-service';

export async function GET() {
  const access = await accessService.getAccessFromCookie();

  if (!access) {
    return NextResponse.json({ granted: false });
  }

  return NextResponse.json({
    granted: access.granted,
    reason: access.reason,
    matchedDomain: access.matchedDomain,
  });
}
