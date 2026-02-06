/**
 * GET /api/user/connected-accounts
 *
 * Returns the current user's connected email accounts and network domains.
 * Used for domain-based access control - checking if user belongs to a VC portfolio.
 *
 * Response:
 * - connectedAccounts: All email accounts the user has connected to Bridge
 * - networkDomains: VC/network domains the user is affiliated with
 * - connectedDomains: Unique non-personal email domains (for access checks)
 */

import { NextResponse } from 'next/server';
import { resolveAuthWithAccounts } from '@/lib/bridge';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  const { authenticated, user, error } = await resolveAuthWithAccounts();

  if (!authenticated || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: error || 'Not authenticated', status: 401 } },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    connectedAccounts: user.connectedAccounts,
    networkDomains: user.networkDomains,
    connectedDomains: user.connectedDomains,
    _debug: {
      timestamp: new Date().toISOString(),
      totalAccounts: user.connectedAccounts.length,
      totalDomains: user.connectedDomains.length,
      totalNetworks: user.networkDomains.length,
    },
  });

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}
