/**
 * Next.js Middleware for Access Control
 *
 * Enforces authentication and authorization at the edge.
 * Uses Bridge identity for user resolution.
 *
 * Auth modes (checked in order):
 * 1. Bridge `authToken` cookie (*.brdg.app domains — set by Bridge on login)
 *    The authToken value IS the user's Bearer token. We call /api/v4/users/me
 *    with Authorization: Bearer {authToken} to resolve the user.
 * 2. API key cookie (localhost, vercel.app, other non-Bridge domains)
 *    User pastes their Bridge API key on /login page, stored as HttpOnly cookie.
 *    Same mechanism — the API key IS a Bearer token.
 *
 * Route protection:
 * - Public routes: always allowed (static assets, API health, login)
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

// Bridge auth cookie — set by Bridge on *.brdg.app after login
// The cookie value is the user's Bearer token for Bridge API
const BRIDGE_AUTH_COOKIE = 'authToken';

// API key cookie — set by /api/auth/login on non-Bridge domains
const BRIDGE_API_KEY_COOKIE = 'bridge_api_key';

// Admin allowlists
const ADMIN_EMAIL_ALLOWLIST = process.env.ADMIN_EMAIL_ALLOWLIST
  ? process.env.ADMIN_EMAIL_ALLOWLIST.split(',').map((e) => e.trim().toLowerCase())
  : [];

const ADMIN_DOMAIN_ALLOWLIST = process.env.ADMIN_DOMAIN_ALLOWLIST
  ? process.env.ADMIN_DOMAIN_ALLOWLIST.split(',').map((d) => d.trim().toLowerCase())
  : [];

// Bridge login URL
const BRIDGE_LOGIN_URL = process.env.BRIDGE_LOGIN_URL || 'https://brdg.app/login';

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Routes that don't require authentication
 */
const PUBLIC_ROUTES_PREFIX = [
  '/_next',
  '/api/health',
  '/api/auth',    // Auth API routes (login/logout)
  '/login',       // API key login page
  '/favicon.ico',
  '/logos',
  '/images',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml',
];

// Exact-match public routes (landing pages accessible without auth)
const PUBLIC_ROUTES_EXACT = [
  '/',
  '/perks',
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
  return (
    PUBLIC_ROUTES_PREFIX.some((route) => pathname.startsWith(route)) ||
    PUBLIC_ROUTES_EXACT.some((route) => pathname === route)
  );
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
 * Check if request is coming from a Bridge domain (*.brdg.app)
 * Cookie-based auth (authToken) only works on Bridge domains.
 * API key auth is used on all other domains.
 */
function isBridgeDomain(request: NextRequest): boolean {
  const host = request.headers.get('host') || '';
  return host.endsWith('.brdg.app') || host === 'brdg.app';
}

/**
 * Extract domain from email address
 */
function getEmailDomain(email: string): string {
  const parts = email.toLowerCase().split('@');
  return parts.length === 2 ? parts[1] : '';
}

/**
 * Check if user email is admin
 *
 * If no allowlists are configured, all authenticated Bridge users
 * get admin access. Once ADMIN_EMAIL_ALLOWLIST or ADMIN_DOMAIN_ALLOWLIST
 * is set in env vars, access will be restricted to those lists.
 */
function isUserAdmin(email: string): boolean {
  // If no allowlists configured, all authenticated users are admin
  if (ADMIN_EMAIL_ALLOWLIST.length === 0 && ADMIN_DOMAIN_ALLOWLIST.length === 0) {
    return true;
  }

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
 * Resolve a Bridge user from a Bearer token.
 *
 * This is the single auth mechanism for both auth modes:
 * - On *.brdg.app: the `authToken` cookie value IS the Bearer token
 * - On other domains: the `bridge_api_key` cookie value IS the Bearer token
 *
 * Both work identically: Authorization: Bearer {token} → /api/v4/users/me
 * The token resolves to its owner's identity.
 */
async function resolveUserFromToken(token: string): Promise<BridgeUser | null> {
  try {
    const response = await fetch(`${BRIDGE_API_BASE_URL}/api/v4/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    // Bridge API returns { user: { id, email, ... }, message: "..." }
    const user = data.user || data;
    if (!user || !user.id || !user.email) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : undefined),
    };
  } catch {
    return null;
  }
}

/**
 * Build redirect URL to Bridge login with return URL
 */
function buildLoginRedirect(_request: NextRequest): NextResponse {
  // Note: Bridge login doesn't support return_to redirect param.
  // After login on brdg.app, the authToken cookie is set on *.brdg.app,
  // so users can navigate back to perks.brdg.app and will be authenticated.
  return NextResponse.redirect(BRIDGE_LOGIN_URL);
}

/**
 * Build authenticated response with user headers
 */
function buildAuthResponse(user: BridgeUser, authMode: string, pathname: string): NextResponse {
  const response = NextResponse.next();
  response.headers.set('x-user-id', user.id);
  response.headers.set('x-user-email', user.email);
  response.headers.set('x-user-is-admin', isUserAdmin(user.email) ? 'true' : 'false');
  response.headers.set('x-auth-mode', authMode);
  // Prevent caching for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
  return response;
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

  // 1. Public routes — allow through, but still resolve auth if possible
  //    so authenticated users get their user data in the layout
  if (isPublicRoute(pathname)) {
    const authToken = request.cookies.get(BRIDGE_AUTH_COOKIE)?.value;
    if (authToken) {
      const user = await resolveUserFromToken(authToken);
      if (user) {
        return buildAuthResponse(user, 'cookie', pathname);
      }
    }
    // Not authenticated on Bridge domain — try API key cookie
    if (!isBridgeDomain(request)) {
      const apiKeyCookie = request.cookies.get(BRIDGE_API_KEY_COOKIE)?.value;
      if (apiKeyCookie) {
        const user = await resolveUserFromToken(apiKeyCookie);
        if (user) {
          return buildAuthResponse(user, 'api-key', pathname);
        }
      }
    }
    // No valid auth — still allow access (public route)
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
    response.headers.set('x-auth-mode', 'bypass');
    // Prevent caching for API routes
    if (pathname.startsWith('/api/')) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }
    return response;
  }

  // 3. Try Bridge authToken cookie (primary — works on *.brdg.app)
  //    Bridge sets this cookie on login. The value IS the user's Bearer token.
  const authToken = request.cookies.get(BRIDGE_AUTH_COOKIE)?.value;

  if (authToken) {
    const user = await resolveUserFromToken(authToken);

    if (user) {
      logMiddleware('Auth mode: cookie', { pathname, userId: user.id });

      // Check admin access
      if (isAdminRoute(pathname) && !isUserAdmin(user.email)) {
        logMiddleware('Admin access denied', { pathname, userId: user.id, email: user.email });
        return NextResponse.rewrite(new URL('/not-found', request.url));
      }

      return buildAuthResponse(user, 'cookie', pathname);
    }

    // authToken exists but is invalid — fall through to next auth method
    logMiddleware('Invalid authToken cookie', { pathname });
  }

  // 4. Try API key cookie auth (fallback — works on non-Bridge domains)
  //    API key auth is NEVER used on *.brdg.app — those domains use authToken only.
  if (!isBridgeDomain(request)) {
    const apiKeyCookie = request.cookies.get(BRIDGE_API_KEY_COOKIE)?.value;

    if (apiKeyCookie) {
      const user = await resolveUserFromToken(apiKeyCookie);

      if (user) {
        logMiddleware('Auth mode: api-key', { pathname, userId: user.id });

        // Check admin access
        if (isAdminRoute(pathname) && !isUserAdmin(user.email)) {
          logMiddleware('Admin access denied (api-key)', { pathname, userId: user.id, email: user.email });
          return NextResponse.rewrite(new URL('/not-found', request.url));
        }

        return buildAuthResponse(user, 'api-key', pathname);
      }

      // API key cookie exists but is invalid — fall through to redirect
      logMiddleware('Invalid API key cookie', { pathname });
    }
  }

  // 5. No valid auth found — redirect to appropriate login
  logMiddleware('No valid auth', { pathname, isBridge: isBridgeDomain(request) });

  // For API routes, return 401
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    );
  }

  // On Bridge domains → redirect to Bridge login
  if (isBridgeDomain(request)) {
    return buildLoginRedirect(request);
  }

  // On non-Bridge domains → redirect to local /login page
  return NextResponse.redirect(new URL('/login', request.url));
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
