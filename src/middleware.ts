/**
 * Next.js Middleware for Access Control
 *
 * Enforces authentication and authorization at the edge.
 * Uses Bridge identity for user resolution.
 *
 * Route protection:
 * - Public routes: always allowed (static assets, API health)
 * - Founder routes (/perks/*): require authenticated Bridge user
 * - Admin routes (/admin/*): require authenticated + isAdmin
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

// Development mode - bypass auth for local testing
const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true';
const DEV_USER_EMAIL = process.env.DEV_USER_EMAIL || 'dev@brdg.app';

// Bridge API configuration
const BRIDGE_API_BASE_URL = process.env.BRIDGE_API_BASE_URL || 'https://api.brdg.app';
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;

// Session cookie names
const BRIDGE_SESSION_COOKIE = process.env.BRIDGE_SESSION_COOKIE || 'bridge_session';
const BRIDGE_TOKEN_COOKIE = process.env.BRIDGE_TOKEN_COOKIE || 'bridge_token';

// Admin allowlists
const ADMIN_EMAIL_ALLOWLIST = process.env.ADMIN_EMAIL_ALLOWLIST
  ? process.env.ADMIN_EMAIL_ALLOWLIST.split(',').map((e) => e.trim().toLowerCase())
  : [];

const ADMIN_DOMAIN_ALLOWLIST = process.env.ADMIN_DOMAIN_ALLOWLIST
  ? process.env.ADMIN_DOMAIN_ALLOWLIST.split(',').map((d) => d.trim().toLowerCase())
  : [];

// Bridge login URL
const BRIDGE_LOGIN_URL = process.env.BRIDGE_LOGIN_URL || 'https://app.brdg.app/login';

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/_next',
  '/api/health',
  '/favicon.ico',
  '/logos',
  '/images',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml',
];

/**
 * API routes that need auth but handled separately
 */
const PROTECTED_API_ROUTES = [
  '/api/perks',
  '/api/vendors',
  '/api/categories',
];

/**
 * Admin-only routes
 */
const ADMIN_ROUTES = [
  '/admin',
];

/**
 * Check if path is a public route
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if path is an admin route
 */
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if path is a protected API route
 */
function isProtectedApiRoute(pathname: string): boolean {
  return PROTECTED_API_ROUTES.some((route) => pathname.startsWith(route));
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract domain from email address
 */
function getEmailDomain(email: string): string {
  const parts = email.toLowerCase().split('@');
  return parts.length === 2 ? parts[1] : '';
}

/**
 * Check if user email is admin
 */
function isUserAdmin(email: string): boolean {
  const normalizedEmail = email.toLowerCase();
  const domain = getEmailDomain(normalizedEmail);

  if (ADMIN_EMAIL_ALLOWLIST.includes(normalizedEmail)) {
    return true;
  }

  if (domain && ADMIN_DOMAIN_ALLOWLIST.includes(domain)) {
    return true;
  }

  return false;
}

/**
 * Minimal user info from Bridge API
 */
interface BridgeUser {
  id: string;
  email: string;
  name?: string;
}

/**
 * Fetch user from Bridge API using session token
 * Lightweight version for middleware - only fetches minimal data
 */
async function getBridgeUser(sessionToken: string): Promise<BridgeUser | null> {
  if (!BRIDGE_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(`${BRIDGE_API_BASE_URL}/api/v4/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${BRIDGE_API_KEY}`,
        'X-Bridge-Session': sessionToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
    };
  } catch {
    return null;
  }
}

/**
 * Build redirect URL to Bridge login with return URL
 */
function buildLoginRedirect(request: NextRequest): NextResponse {
  const returnUrl = encodeURIComponent(request.url);
  const loginUrl = `${BRIDGE_LOGIN_URL}?return_to=${returnUrl}`;
  return NextResponse.redirect(loginUrl);
}

/**
 * Log middleware events (server-side only, minimal)
 */
function logMiddleware(event: string, details?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] ${event}:`, details || '');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 2. Development bypass - allow all requests with mock user
  if (BYPASS_AUTH) {
    logMiddleware('Auth bypassed (dev mode)', { pathname, email: DEV_USER_EMAIL });

    // Check admin access for admin routes even in dev mode
    if (isAdminRoute(pathname)) {
      const isAdmin = isUserAdmin(DEV_USER_EMAIL);
      if (!isAdmin) {
        logMiddleware('Admin access denied (dev mode)', { pathname, email: DEV_USER_EMAIL });
        return NextResponse.rewrite(new URL('/not-found', request.url));
      }
    }

    const response = NextResponse.next();
    response.headers.set('x-user-id', 'dev-user');
    response.headers.set('x-user-email', DEV_USER_EMAIL);
    response.headers.set('x-user-is-admin', isUserAdmin(DEV_USER_EMAIL) ? 'true' : 'false');
    return response;
  }

  // 3. Get session token from cookies
  const sessionToken =
    request.cookies.get(BRIDGE_SESSION_COOKIE)?.value ||
    request.cookies.get(BRIDGE_TOKEN_COOKIE)?.value;

  // 4. If no session, redirect to login (except for API routes)
  if (!sessionToken) {
    logMiddleware('No session', { pathname });

    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // For page routes, redirect to login
    return buildLoginRedirect(request);
  }

  // 5. Validate session with Bridge API
  const user = await getBridgeUser(sessionToken);

  if (!user) {
    logMiddleware('Invalid session', { pathname });

    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // For page routes, redirect to login
    return buildLoginRedirect(request);
  }

  // 6. Check admin access for admin routes
  if (isAdminRoute(pathname)) {
    const isAdmin = isUserAdmin(user.email);

    if (!isAdmin) {
      logMiddleware('Admin access denied', { pathname, userId: user.id, email: user.email });

      // Return 404 to hide admin routes from non-admins
      return NextResponse.rewrite(new URL('/not-found', request.url));
    }

    logMiddleware('Admin access granted', { pathname, userId: user.id });
  }

  // 7. User is authenticated, proceed
  logMiddleware('Auth success', { pathname, userId: user.id });

  // Add user info to request headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-user-id', user.id);
  response.headers.set('x-user-email', user.email);
  response.headers.set('x-user-is-admin', isUserAdmin(user.email) ? 'true' : 'false');

  return response;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCHER CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|logos/|images/).*)',
  ],
};
