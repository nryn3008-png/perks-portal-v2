/**
 * Access Service
 *
 * Core access decision logic for domain-based access control.
 * Determines whether a user has access to perks based on:
 *
 * 1. Admin status (always granted)
 * 2. Direct VC domain match (user works at a whitelisted VC)
 * 3. Portfolio match (user's company is in a VC's portfolio)
 * 4. Manual grant (admin approved an access request)
 *
 * Results are cached in a `perks_access` cookie for performance.
 *
 * IMPORTANT: This module is server-only. Never import in client components.
 */

import { cookies } from 'next/headers';
import type { AccessStatus } from '@/types';
import type { UserWithConnectedAccounts } from '@/lib/bridge';
import { getCachedWhitelistDomains, getCachedPortfolioDomains } from './access-cache';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

/** Cookie name for access status */
const ACCESS_COOKIE_NAME = 'perks_access';

/** Cookie max age (24 hours) */
const ACCESS_COOKIE_MAX_AGE = 24 * 60 * 60;

/** Re-check access if cookie is older than this (1 hour) */
const ACCESS_RECHECK_INTERVAL_MS = 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// LOGGING
// ─────────────────────────────────────────────────────────────────────────────

function logAccess(event: string, details?: Record<string, unknown>): void {
  if (typeof window !== 'undefined') return;
  const timestamp = new Date().toISOString();
  logger.info(`[Access Service] ${timestamp} ${event}:`, details || '');
}

// ─────────────────────────────────────────────────────────────────────────────
// COOKIE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encode access status to cookie value (base64 JSON)
 */
function encodeCookieValue(status: AccessStatus): string {
  return Buffer.from(JSON.stringify(status)).toString('base64');
}

/**
 * Decode access status from cookie value
 */
function decodeCookieValue(value: string): AccessStatus | null {
  try {
    const json = Buffer.from(value, 'base64').toString('utf-8');
    const parsed = JSON.parse(json);

    // Basic validation
    if (typeof parsed.granted !== 'boolean' || !parsed.reason || !parsed.checkedAt) {
      return null;
    }

    return parsed as AccessStatus;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCESS SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const accessService = {
  /**
   * Perform a full access check for a user against the current provider's whitelist.
   *
   * Decision tree:
   * 1. Admin? → granted (admin)
   * 2. User domain is a whitelisted VC domain? → granted (vc_team)
   * 3. User domain is in a VC's portfolio? → granted (portfolio_match)
   * 4. Approved manual request in Supabase? → granted (manual_grant)
   * 5. None → denied
   */
  async checkAccess(
    user: UserWithConnectedAccounts,
    providerId: string
  ): Promise<AccessStatus> {
    const now = new Date().toISOString();

    // 1. Admin bypass
    if (user.isAdmin) {
      logAccess('granted:admin', { userId: user.id, email: user.email });
      return {
        granted: true,
        reason: 'admin',
        checkedAt: now,
        providerId,
      };
    }

    const userDomains = user.connectedDomains;

    // No connected work domains — can't match anything
    if (userDomains.length === 0) {
      logAccess('denied:no_domains', { userId: user.id, email: user.email });
      return {
        granted: false,
        reason: 'denied',
        checkedAt: now,
        providerId,
      };
    }

    // 2. Fetch whitelisted VC domains
    const whitelistedVCs = await getCachedWhitelistDomains(providerId);

    if (whitelistedVCs.length === 0) {
      // No whitelist configured — deny by default
      logAccess('denied:no_whitelist', { userId: user.id, providerId });
      return {
        granted: false,
        reason: 'denied',
        checkedAt: now,
        providerId,
      };
    }

    // 3. Direct VC domain match — user works at a whitelisted VC
    for (const userDomain of userDomains) {
      if (whitelistedVCs.includes(userDomain.toLowerCase())) {
        logAccess('granted:vc_team', {
          userId: user.id,
          matchedDomain: userDomain,
        });
        return {
          granted: true,
          reason: 'vc_team',
          matchedDomain: userDomain,
          matchedVcDomain: userDomain,
          checkedAt: now,
          providerId,
        };
      }
    }

    // 4. Portfolio match — user's company is in a VC's portfolio
    for (const vcDomain of whitelistedVCs) {
      const portfolioDomains = await getCachedPortfolioDomains(vcDomain);

      for (const userDomain of userDomains) {
        if (portfolioDomains.has(userDomain.toLowerCase())) {
          logAccess('granted:portfolio_match', {
            userId: user.id,
            matchedDomain: userDomain,
            matchedVcDomain: vcDomain,
          });
          return {
            granted: true,
            reason: 'portfolio_match',
            matchedDomain: userDomain,
            matchedVcDomain: vcDomain,
            checkedAt: now,
            providerId,
          };
        }
      }
    }

    // 5. Check for approved manual access request
    try {
      const supabase = createSupabaseAdmin();
      const { data: approvedRequest } = await supabase
        .from('access_requests')
        .select('id')
        .eq('user_email', user.email.toLowerCase())
        .eq('status', 'approved')
        .limit(1)
        .single();

      if (approvedRequest) {
        logAccess('granted:manual_grant', {
          userId: user.id,
          email: user.email,
          requestId: approvedRequest.id,
        });
        return {
          granted: true,
          reason: 'manual_grant',
          checkedAt: now,
          providerId,
        };
      }
    } catch {
      // Table might not exist yet or query failed — continue to deny
    }

    // 6. No match found
    logAccess('denied', {
      userId: user.id,
      email: user.email,
      checkedDomains: userDomains,
      whitelistedVCs: whitelistedVCs.length,
    });

    return {
      granted: false,
      reason: 'denied',
      checkedAt: now,
      providerId,
    };
  },

  /**
   * Read access status from the `perks_access` cookie.
   * Returns null if cookie doesn't exist, is invalid, or is malformed.
   */
  async getAccessFromCookie(): Promise<AccessStatus | null> {
    try {
      const cookieStore = await cookies();
      const cookie = cookieStore.get(ACCESS_COOKIE_NAME);

      if (!cookie?.value) return null;

      return decodeCookieValue(cookie.value);
    } catch {
      return null;
    }
  },

  /**
   * Write access status to the `perks_access` cookie.
   */
  async setAccessCookie(status: AccessStatus): Promise<void> {
    try {
      const cookieStore = await cookies();

      cookieStore.set(ACCESS_COOKIE_NAME, encodeCookieValue(status), {
        httpOnly: false, // Needs to be readable in server components via cookies()
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: ACCESS_COOKIE_MAX_AGE,
      });
    } catch (error) {
      // Cookie operations can fail in certain contexts (e.g., middleware)
      if (typeof window === 'undefined') {
        logger.error('[Access Service] Failed to set cookie:', error);
      }
    }
  },

  /**
   * Clear the `perks_access` cookie.
   */
  async clearAccessCookie(): Promise<void> {
    try {
      const cookieStore = await cookies();

      cookieStore.set(ACCESS_COOKIE_NAME, '', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    } catch {
      // Ignore — cookie may already be cleared
    }
  },

  /**
   * Full resolve: check cookie first, fall back to fresh check.
   *
   * This is the primary function called from server components.
   * It minimizes API calls by using the cached cookie result when valid.
   */
  async resolveAccess(
    user: UserWithConnectedAccounts,
    providerId: string
  ): Promise<AccessStatus> {
    // Try cookie first
    const cached = await this.getAccessFromCookie();

    if (cached) {
      // Validate: provider must match current default
      if (cached.providerId !== providerId) {
        logAccess('recheck:provider_changed', {
          userId: user.id,
          cachedProvider: cached.providerId,
          currentProvider: providerId,
        });
        // Provider changed — must re-check
      } else {
        // Check if cookie is still fresh enough
        const checkedAt = new Date(cached.checkedAt).getTime();
        const age = Date.now() - checkedAt;

        if (age < ACCESS_RECHECK_INTERVAL_MS) {
          return cached;
        }

        logAccess('recheck:expired', { userId: user.id, ageMs: age });
      }
    }

    // Perform fresh check
    const status = await this.checkAccess(user, providerId);

    // Cache the result
    await this.setAccessCookie(status);

    return status;
  },
};
