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
import { logger } from '@/lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Connected email account token from Bridge API
 */
export interface BridgeEmailToken {
  id: string;
  email: string;
  is_primary: boolean;
  provider: string;
  full_domain: string;
  is_personal_email: boolean;
  user_pic?: string;
  imported_at?: string;
  synced_at?: string;
  show_deactivated_warning?: boolean;
}

/**
 * Network domain affiliation from Bridge API
 */
export interface BridgeNetworkDomain {
  domain: string;
  role: 'member' | 'guest' | string;
  has_portfolios: boolean;
}

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
  profile_pic_url?: string;
  organization?: {
    id: string;
    name: string;
    domain?: string;
  };
  tokens?: BridgeEmailToken[];
  network_domains?: BridgeNetworkDomain[];
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
 * Connected account info (normalized)
 */
export interface ConnectedAccount {
  email: string;
  domain: string;
  isPrimary: boolean;
  isPersonalEmail: boolean;
  provider: string;
}

/**
 * Network domain info (normalized)
 */
export interface NetworkDomain {
  domain: string;
  role: string;
  hasPortfolios: boolean;
}

/**
 * Full user data including connected accounts
 */
export interface UserWithConnectedAccounts {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  avatarUrl?: string;
  connectedAccounts: ConnectedAccount[];
  networkDomains: NetworkDomain[];
  /** All unique non-personal email domains the user has connected */
  connectedDomains: string[];
}

/**
 * Auth result from resolver
 */
export interface AuthResult {
  authenticated: boolean;
  user: AuthUser | null;
  error?: string;
}

/**
 * Auth result with connected accounts
 */
export interface AuthResultWithAccounts {
  authenticated: boolean;
  user: UserWithConnectedAccounts | null;
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
      logger.info(`${prefix} ${timestamp} Auth success:`, { userId: details?.userId });
      break;
    case 'failure':
      logger.warn(`${prefix} ${timestamp} Auth failure:`, { reason: details?.reason });
      break;
    case 'admin_denied':
      logger.warn(`${prefix} ${timestamp} Admin access denied:`, { userId: details?.userId, email: details?.email });
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
function isUserAdmin(email: string, connectedDomains?: string[]): boolean {
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

  // Check connected account domains (e.g. user's Bridge account is gmail
  // but they have a connected work email @brdg.app)
  if (connectedDomains && ADMIN_DOMAIN_ALLOWLIST.length > 0) {
    for (const connDomain of connectedDomains) {
      if (ADMIN_DOMAIN_ALLOWLIST.includes(connDomain.toLowerCase())) {
        return true;
      }
    }
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

    // Extract connected account domains for admin check
    const connectedDomains: string[] = [];
    if (Array.isArray(profile.tokens)) {
      for (const token of profile.tokens) {
        if (token.email && !token.is_personal_email) {
          const tokenDomain = getEmailDomain(token.email);
          if (tokenDomain && !connectedDomains.includes(tokenDomain)) {
            connectedDomains.push(tokenDomain);
          }
        }
      }
    }

    // Normalize user data
    const user: AuthUser = {
      id: profile.id,
      email: profile.email,
      name: profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
      isAdmin: isUserAdmin(profile.email, connectedDomains),
      avatarUrl: profile.profile_pic_url || profile.avatar_url,
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
  const { authenticated, user, error } = await resolveAuth();

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
// CONNECTED ACCOUNTS RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize Bridge email tokens to connected accounts
 */
function normalizeConnectedAccounts(tokens: BridgeEmailToken[] = []): ConnectedAccount[] {
  return tokens.map((token) => ({
    email: token.email,
    domain: token.full_domain || '',
    isPrimary: token.is_primary,
    isPersonalEmail: token.is_personal_email,
    provider: token.provider,
  }));
}

/**
 * Normalize Bridge network domains
 */
function normalizeNetworkDomains(domains: BridgeNetworkDomain[] = []): NetworkDomain[] {
  return domains.map((domain) => ({
    domain: domain.domain,
    role: domain.role,
    hasPortfolios: domain.has_portfolios,
  }));
}

/**
 * Extract unique non-personal email domains from connected accounts
 */
function extractConnectedDomains(accounts: ConnectedAccount[]): string[] {
  const domains = new Set<string>();

  for (const account of accounts) {
    // Skip personal emails (gmail, yahoo, etc.) and empty domains
    if (!account.isPersonalEmail && account.domain) {
      domains.add(account.domain.toLowerCase());
    }
  }

  return Array.from(domains);
}

/**
 * Resolve Bridge user with full connected accounts data
 *
 * Use this when you need to check user's connected email domains
 * for access control decisions.
 *
 * @returns AuthResultWithAccounts with full user data including connected accounts
 */
export async function resolveAuthWithAccounts(): Promise<AuthResultWithAccounts> {
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

    // Normalize connected accounts and network domains
    const connectedAccounts = normalizeConnectedAccounts(profile.tokens);
    const networkDomains = normalizeNetworkDomains(profile.network_domains);
    const connectedDomains = extractConnectedDomains(connectedAccounts);

    // Build full user object with connected accounts
    const user: UserWithConnectedAccounts = {
      id: profile.id,
      email: profile.email,
      name: profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
      isAdmin: isUserAdmin(profile.email, connectedDomains),
      avatarUrl: profile.profile_pic_url || profile.avatar_url,
      connectedAccounts,
      networkDomains,
      connectedDomains,
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

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS FOR MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

export { ADMIN_EMAIL_ALLOWLIST, ADMIN_DOMAIN_ALLOWLIST };
