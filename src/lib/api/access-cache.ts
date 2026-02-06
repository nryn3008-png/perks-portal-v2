/**
 * Access Control Cache
 *
 * Module-level in-memory cache with TTL for whitelisted domains and
 * portfolio company data. Survives across requests within a warm
 * serverless function invocation. Lost on cold starts (expected).
 *
 * IMPORTANT: This module is server-only. Never import in client components.
 */

import { whitelistService } from './whitelist-service';
import { fetchPortfolioDomains } from './portfolio-client';
import { logger } from '@/lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// CACHE CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

/** How long to cache whitelisted VC domains (5 minutes) */
const WHITELIST_TTL_MS = 5 * 60 * 1000;

/** How long to cache portfolio domains per VC (15 minutes) */
const PORTFOLIO_TTL_MS = 15 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// CACHE IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Get a value from cache, or compute and store it
 */
async function getOrSet<T>(
  key: string,
  ttlMs: number,
  compute: () => Promise<T>
): Promise<T> {
  const existing = cache.get(key) as CacheEntry<T> | undefined;

  if (existing && existing.expiresAt > Date.now()) {
    return existing.data;
  }

  const data = await compute();

  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });

  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get whitelisted VC domains for the current default provider.
 * Fetches from GetProven API and caches for 5 minutes.
 *
 * @returns Array of lowercased VC domain strings (e.g., ["techstars.com", "a16z.com"])
 */
export async function getCachedWhitelistDomains(providerId: string): Promise<string[]> {
  return getOrSet<string[]>(
    `whitelist:${providerId}`,
    WHITELIST_TTL_MS,
    async () => {
      // Fetch all whitelisted domains (large page to get everything)
      const result = await whitelistService.getDomains(1, 1000);

      if (!result.success) {
        logger.error('[Access Cache] Failed to fetch whitelist domains:', result.error);
        return [];
      }

      // Extract just the domain strings, lowercased
      return result.data.data
        .filter((d) => d.is_visible)
        .map((d) => d.domain.toLowerCase());
    }
  );
}

/**
 * Get portfolio company domains for a specific VC.
 * Fetches from Bridge API (public) and caches for 15 minutes.
 *
 * @param vcDomain - The VC domain (e.g., "techstars.com")
 * @returns Set of lowercased portfolio company domains
 */
export async function getCachedPortfolioDomains(vcDomain: string): Promise<Set<string>> {
  return getOrSet<Set<string>>(
    `portfolio:${vcDomain.toLowerCase()}`,
    PORTFOLIO_TTL_MS,
    () => fetchPortfolioDomains(vcDomain)
  );
}

/**
 * Clear all access-related caches.
 * Called when admin switches the default provider.
 */
export function clearAccessCache(): void {
  cache.clear();

  logger.info('[Access Cache] Cache cleared');
}
