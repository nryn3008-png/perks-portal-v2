/**
 * API Key Authentication Logout Route
 *
 * Clears the bridge_api_key cookie to log out users
 * who authenticated via API key (non-Bridge domains only).
 */

import { NextResponse } from 'next/server';

const API_KEY_COOKIE = 'bridge_api_key';

export async function POST() {
  const res = NextResponse.json({ success: true });

  res.cookies.set(API_KEY_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expire immediately
  });

  return res;
}
