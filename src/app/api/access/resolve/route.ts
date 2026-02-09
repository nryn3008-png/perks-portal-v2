/**
 * POST /api/access/resolve
 *
 * Performs a full access check for the authenticated user and persists the
 * result in the `perks_access` cookie. This route handler exists because
 * `cookies().set()` only works in Route Handlers and Server Actions —
 * NOT in Server Components (page.tsx/layout.tsx).
 *
 * Called by the AccessGate client component on mount to ensure the cookie
 * is properly set after every access check.
 */

import { NextResponse } from 'next/server';
import { resolveAuthWithAccounts } from '@/lib/bridge/auth';
import { accessService } from '@/lib/api/access-service';
import { getDefaultProvider } from '@/lib/providers';

export async function POST() {
  const { authenticated, user } = await resolveAuthWithAccounts();

  if (!authenticated || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const provider = await getDefaultProvider();

  if (!provider) {
    return NextResponse.json({ error: 'No provider configured' }, { status: 500 });
  }

  // resolveAccess reads cookie cache, falls back to fresh check,
  // and calls setAccessCookie() — which WORKS here because this is a Route Handler
  const access = await accessService.resolveAccess(user, provider.id);

  return NextResponse.json({
    granted: access.granted,
    reason: access.reason,
    matchedDomain: access.matchedDomain,
    animationShown: access.animationShown ?? false,
  });
}
