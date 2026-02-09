/**
 * API Service Layer
 *
 * Central export for all API services.
 * Import from '@/lib/api' throughout the app.
 *
 * STRICT: Real API data only. NO mock data exports.
 */

export { createPerksService } from './perks-service';
export type { PerksService, PerksFilters, PerksResponse } from './perks-service';

export { createVendorsService } from './vendors-service';
export type { VendorsService, VendorsFilters, VendorsResponse } from './vendors-service';

export { whitelistService } from './whitelist-service';
export { createClient, createClientFromProvider, GetProvenApiError } from './getproven-client';
export type { GetProvenClient, ProviderConfig } from './getproven-client';

// Bridge API (server-only) - for intropath counts
export {
  bridgeClient,
  BridgeApiError,
  getVendorIntropathCounts,
  extractDomainFromUrl,
} from './bridge-client';
export type {
  BridgeIntropathCountResponse,
  VendorIntropathData,
} from './bridge-client';

// Access control (server-only) - domain-based access gating
export { accessService } from './access-service';
export { fetchPortfolioDomains } from './portfolio-client';
export {
  getCachedWhitelistDomains,
  getCachedPortfolioDomains,
  clearAccessCache,
} from './access-cache';
export { checkApiAccess } from './check-api-access';

// Admin changelog (server-only) - audit log for admin actions
export { changelogService } from './changelog-service';
export type { ChangelogFilters, ChangelogListResponse } from './changelog-service';

// Re-export normalizers for advanced use cases
export {
  normalizeDeal,
  normalizeDealToListItem,
  normalizeCategory,
} from '../normalizers/getproven';
