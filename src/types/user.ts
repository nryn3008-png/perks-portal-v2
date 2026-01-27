/**
 * User and authentication types
 */

export type UserRole = 'founder' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;

  // Organization associations
  portfolioCompanyId?: string; // For founders
  vcFirmId: string; // Which VC firm they belong to

  // Metadata
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

/**
 * VC Firm / Fund
 */
export interface VCFirm {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  website?: string;

  // Branding
  primaryColor?: string;
  secondaryColor?: string;

  // Settings
  settings: VCFirmSettings;

  createdAt: string;
  updatedAt: string;
}

export interface VCFirmSettings {
  // Which perks are enabled for this VC's portfolio
  enabledPerkIds?: string[];
  // Categories to show/hide
  enabledCategories?: string[];
  // Custom welcome message
  welcomeMessage?: string;
  // Support contact
  supportEmail?: string;
}

/**
 * Portfolio Company (Startup)
 */
export interface PortfolioCompany {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  website?: string;

  // VC relationship
  vcFirmId: string;
  fundingStage?: string;
  investmentDate?: string;

  // Company details (for eligibility matching)
  employeeCount?: number;
  industry?: string;
  geography?: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * Session context available throughout the app
 */
export interface SessionContext {
  user: User;
  vcFirm: VCFirm;
  portfolioCompany?: PortfolioCompany; // Only for founders
  permissions: UserPermissions;
}

export interface UserPermissions {
  canViewPerks: boolean;
  canRedeemPerks: boolean;
  canManagePerks: boolean; // Admin only
  canManageUsers: boolean; // Admin only
  canViewAnalytics: boolean; // Admin only
}

/**
 * Helper to check user roles
 */
export function isAdmin(user: User): boolean {
  return user.role === 'admin' || user.role === 'super_admin';
}

export function isFounder(user: User): boolean {
  return user.role === 'founder';
}
