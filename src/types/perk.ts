/**
 * Core perk/deal data models
 * These types represent the structure of perks from GetProven API
 */

export type PerkStatus = 'active' | 'expired' | 'coming_soon' | 'archived';

export type RedemptionType = 'code' | 'link' | 'contact' | 'form';

export interface PerkCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string; // Icon identifier or URL
  perkCount?: number;
}

export interface PerkProvider {
  id: string;
  name: string;
  logo?: string;
  faviconUrl?: string; // Derived from website domain, used as fallback for logo
  website?: string;
  description?: string;
}

export interface PerkValue {
  type: 'percentage' | 'fixed' | 'credits' | 'custom';
  amount?: number;
  currency?: string; // e.g., 'USD'
  description: string; // e.g., "$100,000 in AWS credits"
}

export interface PerkRedemption {
  type: RedemptionType;
  code?: string; // Promo code if type is 'code'
  url?: string; // Redemption URL if type is 'link'
  instructions?: string; // How to redeem
  contactEmail?: string; // Contact for redemption if type is 'contact'
}

export interface PerkEligibility {
  fundingStages?: string[]; // e.g., ['pre-seed', 'seed', 'series-a']
  maxEmployees?: number;
  maxRevenue?: number;
  industries?: string[];
  geographies?: string[];
  customRequirements?: string;
}

export interface Perk {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;

  // Categorization
  category: PerkCategory;
  tags?: string[];

  // Provider info
  provider: PerkProvider;

  // Value proposition
  value: PerkValue;

  // Timing
  status: PerkStatus;
  expiresAt?: string; // ISO date
  createdAt: string;
  updatedAt: string;

  // Redemption
  redemption: PerkRedemption;

  // Eligibility
  eligibility?: PerkEligibility;

  // Display
  featured?: boolean;
  sortOrder?: number;
  imageUrl?: string;

  // Tracking
  viewCount?: number;
  redemptionCount?: number;
}

/**
 * Perk list item - lighter version for list views
 */
export interface PerkListItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  category: Pick<PerkCategory, 'id' | 'name' | 'slug'>;
  provider: Pick<PerkProvider, 'id' | 'name' | 'logo' | 'faviconUrl'>;
  value: PerkValue;
  status: PerkStatus;
  featured?: boolean;
  imageUrl?: string;
  expiresAt?: string;
}

/**
 * Filters for perk listing
 */
export interface PerkFilters {
  category?: string;
  search?: string;
  status?: PerkStatus;
  featured?: boolean;
  tags?: string[];
}

/**
 * Paginated response wrapper
 * Uses API-provided next/previous URLs - NO client-side page calculation
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    count: number;        // Total count from API
    next: string | null;  // API-provided next page URL
    previous: string | null; // API-provided previous page URL
  };
}
