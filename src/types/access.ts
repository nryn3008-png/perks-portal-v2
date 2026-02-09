/**
 * Domain-Based Access Control Types
 *
 * Types for the access check system that verifies if a user's
 * connected email domains match a whitelisted VC's portfolio.
 */

// ─────────────────────────────────────────────────────────────────────────────
// ACCESS STATUS (Cookie payload)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reason for access being granted or denied
 */
export type AccessReason =
  | 'admin'            // User is in ADMIN_*_ALLOWLIST
  | 'vc_team'          // User's domain directly matches a whitelisted VC domain
  | 'portfolio_match'  // User's domain found in a whitelisted VC's portfolio
  | 'manual_grant'     // Admin approved a manual access request
  | 'denied';          // No match found

/**
 * Access status — stored in the `perks_access` cookie
 */
export interface AccessStatus {
  granted: boolean;
  reason: AccessReason;
  /** The user's email domain that matched (e.g., "acmestartup.com") */
  matchedDomain?: string;
  /** The VC domain the match was found against (e.g., "techstars.com") */
  matchedVcDomain?: string;
  /** ISO timestamp of when the check was performed */
  checkedAt: string;
  /** Provider ID at time of check — used to invalidate on provider switch */
  providerId: string;
  /** Whether the scanning animation has been shown for this access check */
  animationShown?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCESS REQUESTS (Supabase table)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Status of a manual access request
 */
export type AccessRequestStatus = 'pending' | 'approved' | 'rejected';

/**
 * Manual access request — stored in Supabase `access_requests` table.
 * Created when a user's domain doesn't auto-match any VC portfolio.
 */
export interface AccessRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  company_name: string;
  vc_name: string;
  vc_contact_name: string;
  vc_contact_email: string;
  status: AccessRequestStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// BRIDGE PORTFOLIO API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Portfolio company from Bridge API
 * GET /api/v4/search/network_portfolios?domain={vcDomain}&limit=100&offset=0
 */
export interface BridgePortfolioCompany {
  id: string;
  type: 'portfolio';
  attributes: {
    id: number;
    domain: string;
    description?: string | null;
    industries?: string[] | null;
    status?: string | null;
    funded?: number | null;
    invest_date?: string | null;
  };
}

/**
 * Bridge portfolio API response
 */
export interface BridgePortfolioResponse {
  data: BridgePortfolioCompany[];
}
