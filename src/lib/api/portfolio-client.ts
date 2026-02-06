/**
 * Bridge Portfolio Client
 *
 * Fetches portfolio companies for a VC domain from the Bridge public API.
 * Used for domain-based access control — checking if a founder's company
 * exists in a whitelisted VC's portfolio.
 *
 * IMPORTANT: This module is server-only. Never import in client components.
 *
 * API: GET /api/v4/search/network_portfolios?domain={vcDomain}&limit=100&offset=0
 * Auth: Public endpoint — no authentication required.
 */

import type { BridgePortfolioResponse } from '@/types';
import { logger } from '@/lib/logger';

const BRIDGE_API_BASE_URL = process.env.BRIDGE_API_BASE_URL || 'https://api.brdg.app';

/** Number of portfolio companies to fetch per page */
const PORTFOLIO_PAGE_SIZE = 100;

/** Safety limit to prevent infinite pagination loops */
const MAX_PAGES = 50;

/**
 * Log portfolio client events (server-side only)
 */
function logPortfolio(event: string, details?: Record<string, unknown>): void {
  if (typeof window !== 'undefined') return;

  const timestamp = new Date().toISOString();
  const prefix = '[Portfolio Client]';

  if (event === 'error') {
    logger.error(`${prefix} ${timestamp}`, details);
  } else {
    logger.info(`${prefix} ${timestamp} ${event}:`, details || '');
  }
}

/**
 * Fetch all portfolio company domains for a given VC domain.
 *
 * Paginates through the Bridge API until all companies are fetched
 * or the safety limit is reached.
 *
 * @param vcDomain - The VC domain to fetch portfolios for (e.g., "techstars.com")
 * @returns Set of lowercased portfolio company domains
 */
export async function fetchPortfolioDomains(vcDomain: string): Promise<Set<string>> {
  const domains = new Set<string>();
  let offset = 0;
  let page = 0;

  try {
    while (page < MAX_PAGES) {
      const url = `${BRIDGE_API_BASE_URL}/api/v4/search/network_portfolios?domain=${encodeURIComponent(vcDomain)}&limit=${PORTFOLIO_PAGE_SIZE}&offset=${offset}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        logPortfolio('error', {
          message: `API request failed: ${response.status} ${response.statusText}`,
          vcDomain,
          offset,
        });
        break;
      }

      const data: BridgePortfolioResponse = await response.json();

      // No more results — stop pagination
      if (!data.data || data.data.length === 0) {
        break;
      }

      // Extract domains from portfolio companies
      for (const company of data.data) {
        const domain = company.attributes?.domain;
        if (domain) {
          domains.add(domain.toLowerCase());
        }
      }

      // If we got fewer results than the page size, we've reached the end
      if (data.data.length < PORTFOLIO_PAGE_SIZE) {
        break;
      }

      offset += PORTFOLIO_PAGE_SIZE;
      page++;
    }

    logPortfolio('fetched', {
      vcDomain,
      totalDomains: domains.size,
      pagesScanned: page + 1,
    });
  } catch (error) {
    logPortfolio('error', {
      message: error instanceof Error ? error.message : 'Network error',
      vcDomain,
    });
  }

  return domains;
}
