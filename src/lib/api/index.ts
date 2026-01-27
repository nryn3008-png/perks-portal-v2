/**
 * API Service Layer
 *
 * Central export for all API services.
 * Import from '@/lib/api' throughout the app.
 *
 * STRICT: Real API data only. NO mock data exports.
 */

export { perksService } from './perks-service';
export { vendorsService } from './vendors-service';
export { whitelistService } from './whitelist-service';
export { getProvenClient, GetProvenApiError } from './getproven-client';

// Re-export normalizers for advanced use cases
export {
  normalizeDeal,
  normalizeDealToListItem,
  normalizeCategory,
} from '../normalizers/getproven';
