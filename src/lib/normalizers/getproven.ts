/**
 * GetProven Data Normalizer
 *
 * Transforms raw GetProven API responses into our internal Perk interface.
 * This is the ONLY place where GetProven-specific field names should appear.
 * If GetProven changes their API, only this file needs updates.
 */

import type {
  Perk,
  PerkListItem,
  PerkCategory,
  PerkValue,
  PerkStatus,
  RedemptionType,
  GetProvenDeal,
  GetProvenCategory,
} from '@/types';

// Server-side only logging (never expose to client)
const logWarning = (message: string, context?: Record<string, unknown>) => {
  if (typeof window === 'undefined') {
    console.warn(`[GetProven Normalizer] ${message}`, context || '');
  }
};

/**
 * Sanitize and truncate text
 */
function sanitizeText(text: unknown, maxLength?: number): string {
  if (text === null || text === undefined) return '';
  const str = String(text).trim();
  if (maxLength && str.length > maxLength) {
    return str.slice(0, maxLength - 3) + '...';
  }
  return str;
}

/**
 * Generate a URL-safe slug from text
 */
function generateSlug(text: string, id: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || id;
}

/**
 * Normalize category name from deal data (internal helper)
 */
function normalizeCategoryFromDeal(category: unknown): { id: string; name: string; slug: string } {
  const name = sanitizeText(category) || 'Uncategorized';
  const slug = generateSlug(name, 'uncategorized');
  return {
    id: slug,
    name,
    slug,
  };
}

/**
 * Extract domain from a URL string
 * Returns null if URL is invalid or domain can't be extracted
 */
function extractDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname;
  } catch {
    return null;
  }
}

/**
 * Derive favicon URL from a website domain
 * Uses Google's favicon service as a reliable source
 * Returns undefined if no valid domain available
 */
function deriveFaviconUrl(websiteUrl: string | undefined, redemptionUrl: string | undefined): string | undefined {
  // Try website URL first, then redemption URL as fallback
  const domain = extractDomain(websiteUrl) || extractDomain(redemptionUrl);
  if (!domain) return undefined;

  // Google's favicon service - reliable, fast, and handles missing favicons gracefully
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

/**
 * Parse discount/value information into structured format
 */
function parseValue(deal: GetProvenDeal): PerkValue {
  const estimatedValue = deal.estimated_value;
  const discountType = deal.discount_type;
  const discount = deal.discount;

  // Use estimated_value if available
  if (estimatedValue && estimatedValue > 0) {
    return {
      type: 'credits',
      amount: estimatedValue,
      currency: 'USD',
      description: `$${estimatedValue.toLocaleString()} value`,
    };
  }

  // Use discount if available
  if (discount && discount > 0) {
    if (discountType === 'percentage') {
      return {
        type: 'percentage',
        amount: discount,
        description: `${discount}% off`,
      };
    }
    return {
      type: 'credits',
      amount: discount,
      currency: 'USD',
      description: `$${discount.toLocaleString()} discount`,
    };
  }

  return {
    type: 'custom',
    description: 'Special offer available',
  };
}

/**
 * Determine perk status from deal data
 * Note: API doesn't provide is_active or expiration_date, assume all listed offers are active
 */
function parseStatus(_deal: GetProvenDeal): PerkStatus {
  // All offers returned by the API are assumed to be active
  return 'active';
}

/**
 * Determine redemption type from deal data
 */
function parseRedemptionType(deal: GetProvenDeal): RedemptionType {
  // API provides getproven_link for all offers
  if (deal.getproven_link) return 'link';
  return 'contact';
}

/**
 * Check for missing required fields and log warnings
 */
function validateDeal(deal: GetProvenDeal): void {
  const missingFields: string[] = [];

  if (!deal.name) missingFields.push('name');
  if (!deal.description) missingFields.push('description');

  if (missingFields.length > 0) {
    logWarning(`Deal ${deal.id} missing fields: ${missingFields.join(', ')}`, {
      dealId: deal.id,
      name: deal.name,
    });
  }
}

/**
 * Strip HTML tags from text
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extract provider/vendor name from offer title (max 2 words)
 * Uses real API data (name field) since API doesn't provide vendor names
 * Smart extraction: "Company - Offer" → "Company", or first 2 meaningful words
 */
function extractProviderName(offerName: string): string {
  if (!offerName) return 'Provider';

  // Remove common prefixes like "(Old)", "(New)", "(UK & EU)", etc.
  let cleanName = offerName.replace(/^\([^)]+\)\s*/, '').trim();

  // Words that are likely NOT provider names (action words, common terms)
  const badStartWords = new Set([
    'for', 'the', 'a', 'an', 'and', 'or', 'with', 'to', 'of', 'in', 'on', 'at', 'by',
    'get', 'free', 'we', 'our', 'your', 'up', 'off', 'rate', 'discount', 'save',
    'exclusive', 'special', 'limited', 'offer', 'deal', 'promo', 'promotion',
    'month', 'months', 'year', 'years', 'first', 'new', 'best', 'top', 'premium',
    'funding', 'preferred', 'procurement', 'business', 'case', 'awesome', 'amazing',
    'great', 'super', 'credit', 'credits', 'value', 'roadmap', 'development',
    'approval', 'terms', 'partnership', 'startup', 'startups', 'enterprise',
    'site', 'selection', 'financial', 'incentive', 'dedicated', 'advisory',
    'expert', 'portfolio', 'companies', 'overview', 'network', 'driven',
    'compliance', 'security', 'automation', 'service', 'services', 'solution',
    'solutions', 'platform', 'program', 'early', 'stage', 'series', 'seed',
    'expert-driven', 'greater', 'kuala', 'all-in', 'one', 'corporate', 'tax',
    'exemption', 'personal', 'trial', 'intro', 'welcome', 'hello', 'try',
    'discounts', 'buy', 'now', 'cap', 'table', 'complimentary', 'cfo',
    'early-stage', 'international', 'scale', 'engineering', 'legal', 'total',
    'sourcing', 'strategy', 'sprint', 'sales', 'acceleration', 'revenue',
    'accounting', 'ad', 'ads', 'accelerator', 'checking', 'savings', 'ai',
    'bank', 'accounts', 'call', 'center', 'career', 'pathing', 'booster',
    'programs', 'apply', 'asia', 'coaching', 'session', 'consultation',
    // Additional common words that appear in perk titles
    'guarantee', 'expansion', 'packages', 'licenses', 'less', 'three', 'two',
    'four', 'five', 'six', 'recognition', 'place', 'team', 'teams', 'member',
    'members', 'community', 'train', 'training', 'learn', 'learning', 'join',
    'access', 'unlock', 'receive', 'enjoy', 'claim', 'redeem', 'activate',
    'start', 'begin', 'launch', 'grow', 'build', 'create', 'make', 'take',
    'plus', 'pro', 'basic', 'standard', 'advanced', 'ultimate', 'starter',
    'essentials', 'core', 'full', 'complete', 'annual', 'monthly', 'weekly',
    'than', 'visa', 'visas', 'approval', 'money', 'back', 'perks', 'perk',
    'any', 'all', 'product', 'global', 'management', 'plan', 'plans',
    'developer', 'developers', 'digital', 'insurance', 'agreement',
    'cash', 'approvals', 'income', 'lumpur', 'finance', 'expert-driven',
    'talent', 'paid', 'equity', 'payroll', 'software', 'accessibility',
    'hardware', 'cloud', 'data', 'analytics', 'marketing', 'hiring',
    'from', 'company', 'customized', 'fee', 'fees', 'founders', 'founder',
    'growth', 'implementation', 'win-loss', 'gkl', 'eor', 'partner',
    'proven', 'canadian', 'contractor', 'initial', 'interview', 'leading',
    'lifetime', 'live', 'more', 'office', 'pricing', 'revops', 'setup',
    'concierge', 'lab', 'tech', 'yearly', 'support', 'o-1a', 'recruitment'
  ]);

  // Helper: extract first word only, clean punctuation
  const getFirstWord = (text: string): string => {
    const word = text.trim().split(/\s+/)[0] || '';
    return word.replace(/[,.:;!?]+$/, '');
  };

  // Helper: check if text looks like a valid provider name
  const isValidProvider = (text: string): boolean => {
    if (!text || text.length < 3 || text.length > 20) return false;
    // Must start with a letter
    if (!/^[a-zA-Z]/.test(text)) return false;
    // Must not contain special chars at start
    if (/^[\d$%*&@#]/.test(text)) return false;
    // Check first word against bad list
    const firstWord = text.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '') || '';
    if (badStartWords.has(firstWord)) return false;
    // Must not end with & or other partial words
    if (/[&]$/.test(text)) return false;
    return true;
  };

  // Pattern 1: "Company - Offer" or "Company – Offer"
  const dashMatch = cleanName.match(/^([^-–]+)\s*[-–]/);
  if (dashMatch) {
    const extracted = getFirstWord(dashMatch[1]);
    if (isValidProvider(extracted)) return extracted;
  }

  // Pattern 2: "Company: Offer"
  const colonMatch = cleanName.match(/^([^:]+):/);
  if (colonMatch) {
    const extracted = getFirstWord(colonMatch[1]);
    if (isValidProvider(extracted)) return extracted;
  }

  // Pattern 3: "X for Startups/Y" - X is often the provider (single word)
  const forStartupsMatch = cleanName.match(/^(\S+)\s+for\s+(startups?|companies|founders)/i);
  if (forStartupsMatch) {
    const extracted = forStartupsMatch[1].replace(/[,.:;!?]+$/, '');
    if (isValidProvider(extracted)) return extracted;
  }

  // Pattern 4: Extract first meaningful word (must look like a brand name)
  const words = cleanName.split(/\s+/);

  for (const word of words) {
    const cleanWord = word.replace(/[,.:;!?]+$/, '');
    const wordLower = cleanWord.toLowerCase();

    // Skip bad words, numbers, special chars
    if (badStartWords.has(wordLower)) continue;
    if (/^[\d$%&]/.test(cleanWord)) continue;
    if (cleanWord.length < 2) continue;

    // Found a valid word - validate and return
    if (isValidProvider(cleanWord)) {
      return cleanWord;
    }
    break; // Only try the first candidate
  }

  return 'Provider';
}

/**
 * Normalize a single GetProven deal into our Perk interface
 */
export function normalizeDeal(deal: GetProvenDeal): Perk {
  validateDeal(deal);

  const title = sanitizeText(deal.name) || 'Untitled Perk';
  const slug = generateSlug(title, String(deal.id));
  const rawDescription = deal.description || '';
  const description = stripHtml(rawDescription);
  const category = normalizeCategoryFromDeal(
    deal.offer_categories?.[0] || 'General'
  );
  const value = parseValue(deal);
  const status = parseStatus(deal);

  // Derive favicon from getproven_link domain
  const faviconUrl = deriveFaviconUrl(undefined, deal.getproven_link);

  return {
    id: String(deal.id),
    title,
    slug,
    shortDescription: sanitizeText(description, 200) || sanitizeText(title, 200),
    fullDescription: description || title || 'No description available.',
    category,
    provider: {
      id: `vendor-${deal.vendor_id}`,
      name: extractProviderName(deal.name),
      logo: deal.picture || undefined,
      faviconUrl,
    },
    value,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    redemption: {
      type: parseRedemptionType(deal),
      url: deal.getproven_link || undefined,
      instructions: deal.getproven_link
        ? 'Click the button below to view offer details on GetProven'
        : 'Contact the provider to redeem',
    },
    expiresAt: undefined,
    featured: false,
  };
}

/**
 * Normalize a deal into a list item (lighter version)
 */
export function normalizeDealToListItem(deal: GetProvenDeal): PerkListItem {
  const perk = normalizeDeal(deal);
  return {
    id: perk.id,
    title: perk.title,
    slug: perk.slug,
    shortDescription: perk.shortDescription,
    category: perk.category,
    provider: {
      id: perk.provider.id,
      name: perk.provider.name,
      logo: perk.provider.logo,
      faviconUrl: perk.provider.faviconUrl,
    },
    value: perk.value,
    status: perk.status,
    featured: perk.featured,
    expiresAt: perk.expiresAt,
  };
}

/**
 * Normalize a GetProven category
 */
export function normalizeCategory(category: GetProvenCategory): PerkCategory {
  return {
    id: String(category.id),
    name: sanitizeText(category.name) || 'Uncategorized',
    slug: category.slug || generateSlug(category.name, String(category.id)),
    perkCount: category.deal_count || 0,
  };
}

