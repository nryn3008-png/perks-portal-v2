/**
 * API Key Authentication Login Route
 *
 * Validates a Bridge API key and sets an HttpOnly cookie for subsequent requests.
 * This route is used ONLY on non-Bridge domains (localhost, vercel.app, etc.)
 * where cookie-based Bridge auth is unavailable.
 *
 * The API key resolves to its owner's identity via Bridge API /users/me.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const BRIDGE_API_BASE_URL = process.env.BRIDGE_API_BASE_URL || 'https://api.brdg.app';
const API_KEY_COOKIE = 'bridge_api_key';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Validate the API key against Bridge API
    // The key resolves to its owner's profile
    const response = await fetch(`${BRIDGE_API_BASE_URL}/api/v4/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    const data = await response.json();

    // Bridge API returns { user: { id, email, ... }, message: "..." }
    const user = data.user;
    if (!user || !user.id || !user.email) {
      return NextResponse.json(
        { error: 'Invalid API response' },
        { status: 500 }
      );
    }

    // Set HttpOnly cookie with the API key
    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.first_name
          ? `${user.first_name} ${user.last_name || ''}`.trim()
          : user.email,
      },
    });

    res.cookies.set(API_KEY_COOKIE, apiKey.trim(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    if (process.env.NODE_ENV === 'development') {
      logger.info('[Auth] API key login successful:', { userId: user.id, email: user.email });
    }

    return res;
  } catch (error) {
    logger.error('Login failed:', error);
    return NextResponse.json(
      { error: 'Failed to validate API key' },
      { status: 500 }
    );
  }
}
