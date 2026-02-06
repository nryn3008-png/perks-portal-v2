/**
 * API Key Authentication Logout Route
 *
 * Clears the bridge_api_key and perks_access cookies to log out users
 * who authenticated via API key (non-Bridge domains only).
 */

import { NextResponse } from 'next/server';

const API_KEY_COOKIE = 'bridge_api_key';
const ACCESS_COOKIE = 'perks_access';

export async function POST() {
  const res = NextResponse.json({ success: true });

  // Clear auth cookie
  res.cookies.set(API_KEY_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expire immediately
  });

  // Clear access control cookie
  res.cookies.set(ACCESS_COOKIE, '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expire immediately
  });

  return res;
}
