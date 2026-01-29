/**
 * Bridge Authentication Resolver
 *
 * Server-only module for resolving Bridge user identity from requests.
 * Handles session validation, user profile fetching, and admin determination.
 *
 * Auth mechanism:
 * - Reads the `authToken` cookie (set by Bridge on *.brdg.app)
 *   OR the `bridge_api_key` cookie (set by /api/auth/login on other domains)
 * - The cookie value IS the user's Bearer token
 * - Calls /api/v4/users/me with Authorization: Bearer {token}
 * - Bridge API returns the token owner's profile
 *
 * IMPORTANT: This module is server-only. Never import in client components.
 */

import { cookies } from 'next/headers';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bridge user profile from API
 */
export interface BridgeUserProfile {
  id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  organization?: {
    id: string;
    name: string;
    domain?: string;
  };
}

/**
 * Normalized user object for internal use
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  avatarUrl?: string;
}

/**
 * Auth result from resolver
 */
export interface AuthResult {
  authenticated: boolean;
  user: AuthUser | null;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const BRIDGE_API_BASE_URL = process.env.BRIDGE_API_BASE_URL || 'https://api.brdg.app';

// Bridge auth cookie — set by Bridge on *.brdg.app after login
// The cookie value IS the user's Bearer token
const BRIDGE_AUTH_COOKIE = 'authToken';

// API key cookie — set by /api/auth/login on non-Bridge domains
const BRIDGE_API_KEY_COOKIE = 'bridge_api_key';

// Admin allowlists from environment (comma-separated)
const ADMIN_EMAIL_ALLOWLIST = process.env.ADMIN_EMAIL_ALLOWLIST
  ? process.env.ADMIN_EMAIL_ALLOWLIST.split(',').map((e) => e.trim().toLowerCase())
  : [];

const ADMIN_DOMAIN_ALLOWLIST = process.env.ADMIN_DOMAIN_ALLOWLIST
  ? process.env.ADMIN_DOMAIN_ALLOWLIST.split(',').map((d) => d.trim().toLowerCase())
  : [];

// Bridge login URL for redirects
export const BRIDGE_LOGIN_URL = process.env.BRIDGE_LOGIN_URL || 'https://app.brdg.app/login';

// ─────────────────────────────────────────────────────────────────────────────
// LOGGING (server-only, minimal)
// ─────────────────────────────────────────────────────────────────────────────

function logAuth(event: 'success' | 'failure' | 'admin_denied', details?: Record<string, unknown>): void {
  if (typeof window !== 'undefined') return;

  const timestamp = new Date().toISOString();
  const prefix = '[Bridge Auth]';

  switch (event) {
    case 'success':
      console.log(`${prefix} ${timestamp} Auth success:`, { userId: details?.userId });
      break;
    case 'failure':
      console.warn(`${prefix} ${timestamp} Auth failure:`, { reason: details?.reason });
      break;
    case 'admin_denied':
      console.warn(`${prefix} ${timestamp} Admin access denied:`, { userId: details?.userId, email: details?.email });
      break;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DETERMINATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract domain from email address
 */
function getEmailDomain(email: string): string {
  const parts = email.toLowerCase().split('@');
  return parts.length === 2 ? parts[1] : '';
}

/**
 * Check if user is an admin based on email or domain allowlists
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

  // Check email allowlist first
  if (ADMIN_EMAIL_ALLOWLIST.includes(normalizedEmail)) {
    return true;
  }

  // Check domain allowlist
  if (domain && ADMIN_DOMAIN_ALLOWLIST.includes(domain)) {
    return true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// BRIDGE API CALLS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch user profile from Bridge API using a Bearer token.
 *
 * The token can be either:
 * - The authToken cookie value (Bridge session on *.brdg.app)
 * - A user's API key (from /login page on non-Bridge domains)
 *
 * Both resolve to the token owner's profile via Authorization: Bearer {token}
 */
async function fetchBridgeUserProfile(token: string): Promise<BridgeUserProfile | null> {
  try {
    const response = await fetch(`${BRIDGE_API_BASE_URL}/api/v4/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // Don't cache user profile
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        logAuth('failure', { reason: 'Invalid or expired token' });
        return null;
      }
      logAuth('failure', { reason: `API error: ${response.status}` });
      return null;
    }

    const data = await response.json();
    // Bridge API returns { user: { id, email, ... }, message: "..." }
    const user = data.user || data;
    return user as BridgeUserProfile;
  } catch (error) {
    logAuth('failure', { reason: error instanceof Error ? error.message : 'Network error' });
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN AUTH RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve Bridge user from the current request
 *
 * Checks for auth tokens in this order:
 * 1. `authToken` cookie (Bridge session on *.brdg.app)
 * 2. `bridge_api_key` cookie (API key on non-Bridge domains)
 *
 * @returns AuthResult with user data or null if unauthenticated
 */
export async function resolveAuth(): Promise<AuthResult> {
  try {
    // Get cookies from the request
    const cookieStore = await cookies();

    // Try authToken cookie first (Bridge session), then API key cookie
    const token =
      cookieStore.get(BRIDGE_AUTH_COOKIE)?.value ||
      cookieStore.get(BRIDGE_API_KEY_COOKIE)?.value;

    if (!token) {
      logAuth('failure', { reason: 'No auth token found' });
      return {
        authenticated: false,
        user: null,
        error: 'No session',
      };
    }

    // Fetch user profile from Bridge API using the Bearer token
    const profile = await fetchBridgeUserProfile(token);

    if (!profile) {
      return {
        authenticated: false,
        user: null,
        error: 'Invalid session',
      };
    }

    // Normalize user data
    const user: AuthUser = {
      id: profile.id,
      email: profile.email,
      name: profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
      isAdmin: isUserAdmin(profile.email),
      avatarUrl: profile.avatar_url,
    };

    logAuth('success', { userId: user.id });

    return {
      authenticated: true,
      user,
    };
  } catch (error) {
    logAuth('failure', { reason: error instanceof Error ? error.message : 'Unknown error' });
    return {
      authenticated: false,
      user: null,
      error: 'Auth error',
    };
  }
}

/**
 * Check if current user has admin access
 * Returns the user if admin, null otherwise
 */
export async function requireAdmin(): Promise<AuthUser | null> {
  const { authenticated, user } = await resolveAuth();

  if (!authenticated || !user) {
    return null;
  }

  if (!user.isAdmin) {
    logAuth('admin_denied', { userId: user.id, email: user.email });
    return null;
  }

  return user;
}

/**
 * Check if current user is authenticated (founder or admin)
 * Returns the user if authenticated, null otherwise
 */
export async function requireAuth(): Promise<AuthUser | null> {
  const { authenticated, user } = await resolveAuth();

  if (!authenticated || !user) {
    return null;
  }

  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS FOR MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

export { ADMIN_EMAIL_ALLOWLIST, ADMIN_DOMAIN_ALLOWLIST };
