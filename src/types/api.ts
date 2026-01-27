/**
 * API request/response types and error handling
 */

/**
 * Standard API error response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  status: number;
}

/**
 * API response wrapper
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

/**
 * GetProven API specific types
 * Based on actual API response from /offers/
 */

// Nested types within offer response
export interface OfferCategory {
  name: string;
}

export interface OfferInvestmentLevel {
  name: string;
}

/**
 * GetProven Category from /categories/ endpoint
 */
export interface GetProvenCategory {
  id: number;
  name: string;
  slug: string;
  deal_count?: number;
}

/**
 * GetProven Offer (Deal) from /offers/ endpoint
 * This is the RAW API response structure
 *
 * Redemption fields (redeem_steps, coupon_code, contact_email, details_url)
 * are ONLY present when enable_ext_api_redemption_details is ON for the community.
 * NEVER assume these exist - always check before rendering.
 */
export interface GetProvenDeal {
  id: number;
  vendor_id: number;
  name: string;                              // Offer title/name
  description: string;                       // HTML description
  picture: string | null;                    // Logo/image URL
  deal_type: string | null;                  // e.g., "discount"
  estimated_value_type: string | null;       // e.g., "fixed"
  estimated_value: number | null;            // Value in dollars
  old_price: number | null;
  new_price: number | null;
  discount_type: string | null;              // e.g., "percentage"
  discount: number | null;                   // Discount amount
  applicable_to_type: string | null;         // Eligibility info
  offer_categories: OfferCategory[];         // Array of {name: string}
  investment_levels: OfferInvestmentLevel[]; // Array of {name: string}
  terms_and_conditions_text: string | null;
  terms_and_conditions: string | null;
  getproven_link: string;                    // Redemption URL

  // Redemption fields - OPTIONAL, only present if enable_ext_api_redemption_details is ON
  redeem_steps?: string | null;              // HTML instructions for redemption
  coupon_code?: string | null;               // Promo/coupon code
  contact_email?: string | null;             // Contact email for redemption
  details_url?: string | null;               // External URL for more details
}

/**
 * GetProven API list response
 */
export interface GetProvenListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Request options for API calls
 */
export interface ApiRequestOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  offerCategories?: string;      // Comma-separated category names
  investmentLevels?: string;     // Comma-separated investment level names
}

/**
 * Vendor request options
 */
export interface VendorRequestOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  serviceName?: string;          // Filter by service name
  groupName?: string;            // Filter by vendor group name
}

// Nested types within vendor response
export interface VendorService {
  name: string;
}

export interface VendorIndustry {
  name: string;
}

export interface VendorGroup {
  name: string;
}

/**
 * GetProven Vendor from /vendors/ endpoint
 * This is the RAW API response structure
 */
export interface GetProvenVendor {
  id: number;
  slug: string;
  name: string;
  logo: string | null;
  website: string | null;
  description: string | null;              // HTML description
  story: string | null;                    // HTML story
  primary_service: string | null;
  services: VendorService[];
  industries: VendorIndustry[];
  founded: number | null;
  employee_min: number | null;
  employee_max: number | null;
  brochure: string | null;
  video: string | null;
  linkedin: string | null;
  facebook: string | null;
  twitter: string | null;
  is_visible: boolean;
  is_visible_non_whitelisted: boolean;
  getproven_link: string;
  vendor_groups: VendorGroup[];
}

/**
 * GetProven Vendor Client from /vendors/{id}/clients/ endpoint
 */
export interface VendorClient {
  id: number;
  name: string;
  logo: string | null;
  description: string | null;
  verified: boolean;
}

/**
 * GetProven Vendor User from /vendors/{id}/users/ endpoint
 * Roles include: vendor_owner, vendor_contact_person, vendor_support
 */
export interface VendorUser {
  id: number;
  avatar: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;           // Do NOT expose by default
  position: string | null;
  roles: string[];
}

/**
 * Whitelist Domain from /whitelist/domains/ endpoint
 */
export interface WhitelistDomain {
  id: number;
  domain: string;
  offer_categories: { name: string }[];
  investment_level: { name: string } | null;
  is_visible: boolean;
}

/**
 * Individual Access from /whitelist/individual_access/ endpoint
 */
export interface IndividualAccess {
  id: number;
  email: string;
  offer_categories: { name: string }[];
  investment_level: { name: string } | null;
}
