/**
 * POST /api/access-request/refresh
 *
 * Clears the `perks_access` cookie to force a fresh access check
 * on the next page load. Called from the Access Restricted page
 * when a user clicks "Refresh Access Check".
 */

import { NextResponse } from 'next/server';

const ACCESS_COOKIE_NAME = 'perks_access';

export async function POST() {
  const res = NextResponse.json({ success: true });

  res.cookies.set(ACCESS_COOKIE_NAME, '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expire immediately
  });

  return res;
}
