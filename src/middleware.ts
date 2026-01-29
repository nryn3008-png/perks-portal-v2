/**
 * Next.js Middleware for Access Control
 *
 * Enforces authentication and authorization at the edge.
 * Uses Bridge identity for user resolution.
 *
 * Auth modes (checked in order):
 * 1. Cookie-based Bridge session (*.brdg.app domains)
 * 2. API key cookie (localhost, vercel.app, other non-Bridge domains)
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
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;

// Session cookie names (Bridge cookie-based auth)
const BRIDGE_SESSION_COOKIE = process.env.BRIDGE_SESSION_COOKIE || 'bridge_session';
const BRIDGE_TOKEN_COOKIE = process.env.BRIDGE_TOKEN_COOKIE || 'bridge_token';

// API key cookie name (non-Bridge domain auth)
const BRIDGE_API_KEY_COOKIE = 'bridge_api_key';

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
  '/api/auth',    // Auth API routes (login/logout)
  '/login',       // API key login page
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
 * Check if request is coming from a Bridge domain (*.brdg.app)
 * Cookie-based auth only works on Bridge domains.
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
 * Fetch user from Bridge API using session token (cookie-based auth)
 *
 * Used on *.brdg.app domains where Bridge sets session cookies.
 * Sends the session token via X-Bridge-Session header alongside the API key.
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
    // Bridge API returns { user: { id, email, ... }, message: "..." }
    const user = data.user || data;
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
 * Fetch user from Bridge API using an API key directly
 *
 * Used on non-Bridge domains (localhost, vercel.app, etc.)
 * where cookie-based auth is unavailable.
 *
 * The API key resolves to its owner's identity — this is by design.
 * Each user has their own API key from Bridge Settings.
 */
async function getBridgeUserFromApiKey(apiKey: string): Promise<BridgeUser | null> {
  try {
    const response = await fetch(`${BRIDGE_API_BASE_URL}/api/v4/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    // Bridge API returns { user: { id, email, ... }, message: "..." }
    const user = data.user || data;
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
function buildLoginRedirect(request: NextRequest): NextResponse {
  const returnUrl = encodeURIComponent(request.url);
  const loginUrl = `${BRIDGE_LOGIN_URL}?return_to=${returnUrl}`;
  return NextResponse.redirect(loginUrl);
}

/**
 * Build authenticated response with user headers
 */
function buildAuthResponse(user: BridgeUser, authMode: string): NextResponse {
  const response = NextResponse.next();
  response.headers.set('x-user-id', user.id);
  response.headers.set('x-user-email', user.email);
  response.headers.set('x-user-is-admin', isUserAdmin(user.email) ? 'true' : 'false');
  response.headers.set('x-auth-mode', authMode);
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
    response.headers.set('x-auth-mode', 'bypass');
    return response;
  }

  // 3. Try cookie-based Bridge session auth (primary — works on *.brdg.app)
  const sessionToken =
    request.cookies.get(BRIDGE_SESSION_COOKIE)?.value ||
    request.cookies.get(BRIDGE_TOKEN_COOKIE)?.value;

  if (sessionToken) {
    const user = await getBridgeUser(sessionToken);

    if (user) {
      logMiddleware('Auth mode: cookie', { pathname, userId: user.id });

      // Check admin access
      if (isAdminRoute(pathname) && !isUserAdmin(user.email)) {
        logMiddleware('Admin access denied', { pathname, userId: user.id, email: user.email });
        return NextResponse.rewrite(new URL('/not-found', request.url));
      }

      return buildAuthResponse(user, 'cookie');
    }

    // Session cookie exists but is invalid — fall through to next auth method
    logMiddleware('Invalid session cookie', { pathname });
  }

  // 4. Try API key cookie auth (fallback — works on non-Bridge domains)
  //    API key auth is NEVER used on *.brdg.app — those domains use cookie auth only.
  if (!isBridgeDomain(request)) {
    const apiKeyCookie = request.cookies.get(BRIDGE_API_KEY_COOKIE)?.value;

    if (apiKeyCookie) {
      const user = await getBridgeUserFromApiKey(apiKeyCookie);

      if (user) {
        logMiddleware('Auth mode: api-key', { pathname, userId: user.id });

        // Check admin access
        if (isAdminRoute(pathname) && !isUserAdmin(user.email)) {
          logMiddleware('Admin access denied (api-key)', { pathname, userId: user.id, email: user.email });
          return NextResponse.rewrite(new URL('/not-found', request.url));
        }

        return buildAuthResponse(user, 'api-key');
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
