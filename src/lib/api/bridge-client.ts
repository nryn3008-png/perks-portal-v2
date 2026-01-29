/**
 * Bridge API Client
 *
 * Server-only client for making authenticated requests to the Bridge API.
 * Used for fetching intropath counts and warm connection insights.
 *
 * IMPORTANT: This client should only be used server-side to protect the API key.
 * NEVER import this file in client components.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bridge API intropath count response
 * Returns the number of warm introduction paths to an organization
 */
export interface BridgeIntropathCountResponse {
  people: unknown[];
  organization: {
    intropath_count: number;
    org_profile_url?: string;
  } | null;
}

/**
 * Normalized intropath data for internal use
 */
export interface VendorIntropathData {
  intropathCount: number | null;
  orgProfileUrl?: string;
}

/**
 * Bridge API error response
 */
export interface BridgeApiErrorResponse {
  error?: string;
  message?: string;
  detail?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const BRIDGE_API_BASE_URL = process.env.BRIDGE_API_BASE_URL || 'https://api.brdg.app';
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;

// ─────────────────────────────────────────────────────────────────────────────
// ERROR CLASS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Custom error class for Bridge API errors
 */
export class BridgeApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BridgeApiError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract domain from a URL string
 * Handles various URL formats and edge cases
 */
export function extractDomainFromUrl(url: string | null): string | null {
  if (!url) return null;

  try {
    // Handle URLs without protocol
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    const parsedUrl = new URL(normalizedUrl);
    let domain = parsedUrl.hostname;

    // Remove 'www.' prefix if present
    if (domain.startsWith('www.')) {
      domain = domain.slice(4);
    }

    // Validate domain has at least one dot (basic validation)
    if (!domain.includes('.')) {
      return null;
    }

    return domain;
  } catch {
    // URL parsing failed
    return null;
  }
}

/**
 * Log Bridge API errors (server-side only)
 */
function logBridgeApiError(operation: string, error: unknown): void {
  if (typeof window === 'undefined') {
    console.error(`[Bridge API] ${operation} failed:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: error instanceof BridgeApiError ? error.code : undefined,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API CLIENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Make authenticated request to Bridge API
 */
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  userToken?: string
): Promise<T> {
  const token = userToken || BRIDGE_API_KEY;
  if (!token) {
    throw new BridgeApiError(
      'MISSING_API_KEY',
      'Bridge API key is not configured and no user token provided',
      500
    );
  }

  const url = `${BRIDGE_API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData: BridgeApiErrorResponse = {};
    try {
      errorData = await response.json();
    } catch {
      // Response body might not be JSON
    }

    throw new BridgeApiError(
      'API_ERROR',
      errorData.detail || errorData.message || errorData.error || `API request failed: ${response.statusText}`,
      response.status,
      errorData as Record<string, unknown>
    );
  }

  return response.json();
}

/**
 * Bridge API Client
 * Server-side only - do not use in client components
 */
export const bridgeClient = {
  /**
   * Get intropath counts for a domain
   * Returns the number of warm introduction paths available
   *
   * @param domain - The domain to look up (e.g., "stripe.com")
   * @returns Intropath count response or throws on error
   */
  async getIntropathCounts(domain: string, userToken?: string): Promise<BridgeIntropathCountResponse> {
    const params = new URLSearchParams({ domain });
    return makeRequest<BridgeIntropathCountResponse>(
      `/api/v4/search/intropath_counts?${params.toString()}`,
      {},
      userToken
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HIGH-LEVEL HELPER
// ─────────────────────────────────────────────────────────────────────────────

// Mock data flag - set to true to test UI without real API
const USE_MOCK_INTROPATH_DATA = process.env.USE_MOCK_INTROPATH_DATA === 'true';

/**
 * Generate mock intropath data for testing
 * Uses a deterministic "random" based on domain hash for consistent results
 */
function getMockIntropathData(domain: string): VendorIntropathData {
  // Simple hash to get consistent mock data per domain
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = ((hash << 5) - hash) + domain.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use hash to determine if this domain "has" connections (about 70% chance)
  const hasConnections = Math.abs(hash) % 10 < 7;

  if (!hasConnections) {
    return { intropathCount: null, orgProfileUrl: undefined };
  }

  // Generate a count between 1 and 50
  const count = (Math.abs(hash) % 50) + 1;

  return {
    intropathCount: count,
    orgProfileUrl: `https://app.brdg.app/org/${domain.replace(/\./g, '-')}`,
  };
}

/**
 * Get intropath counts for a vendor by their website URL
 *
 * This is the primary function to use when loading vendor data.
 * It handles:
 * - Domain extraction from website URL
 * - Graceful error handling (returns null on failure)
 * - Server-side logging for debugging
 * - Mock data support for testing (set USE_MOCK_INTROPATH_DATA=true)
 *
 * @param websiteUrl - The vendor's website URL (can include protocol, www, path)
 * @returns VendorIntropathData with count and optional profile URL, or null values on failure
 */
export async function getVendorIntropathCounts(
  websiteUrl: string | null,
  userToken?: string
): Promise<VendorIntropathData> {
  // Default response for failures
  const emptyResponse: VendorIntropathData = {
    intropathCount: null,
    orgProfileUrl: undefined,
  };

  // Extract domain from URL
  const domain = extractDomainFromUrl(websiteUrl);
  if (!domain) {
    // No valid domain - not an error, just no data available
    return emptyResponse;
  }

  // Return mock data if enabled (for testing UI)
  if (USE_MOCK_INTROPATH_DATA) {
    if (typeof window === 'undefined') {
      console.log(`[Bridge API] Using mock data for domain: ${domain}`);
    }
    return getMockIntropathData(domain);
  }

  // Check if any auth token is available
  if (!userToken && !BRIDGE_API_KEY) {
    // Log only in development/server
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn('[Bridge API] No user token or BRIDGE_API_KEY configured, skipping intropath fetch');
    }
    return emptyResponse;
  }

  try {
    const response = await bridgeClient.getIntropathCounts(domain, userToken);

    // Extract data from nested organization object
    if (!response.organization) {
      return emptyResponse;
    }

    return {
      intropathCount: response.organization.intropath_count,
      orgProfileUrl: response.organization.org_profile_url,
    };
  } catch (error) {
    // Log error server-side but don't throw - fail silently
    logBridgeApiError(`getIntropathCounts(${domain})`, error);
    return emptyResponse;
  }
}
