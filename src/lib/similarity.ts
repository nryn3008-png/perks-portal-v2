/**
 * Similarity Calculation Utilities
 *
 * Client-side utilities for finding similar perks and vendors based on
 * shared attributes. Uses only existing API data - no additional fetches.
 *
 * SIMILAR PERKS: Match by offer_categories, deal_type, investment_levels, vendor primary_service
 * SIMILAR VENDORS: Match by services, industries, primary_service
 */

import type { GetProvenDeal, GetProvenVendor } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// SIMILAR PERKS
// ─────────────────────────────────────────────────────────────────────────────

interface VendorInfo {
  logo: string | null;
  name: string;
  primaryService?: string | null;
}

interface PerkSimilarityScore {
  perk: GetProvenDeal;
  score: number;
  isDifferentVendor: boolean;
}

/**
 * Calculate similarity score between two perks
 *
 * Scoring:
 * - Same offer_categories: +3 per match
 * - Same deal_type: +2
 * - Same investment_levels: +2 per match
 * - Same vendor primary_service: +4 (strong signal for service area match)
 */
function calculatePerkSimilarity(
  basePerk: GetProvenDeal,
  candidatePerk: GetProvenDeal,
  baseVendorService?: string | null,
  candidateVendorService?: string | null
): number {
  let score = 0;

  // Match offer_categories (strongest signal)
  const baseCategories = new Set(basePerk.offer_categories.map((c) => c.name));
  for (const cat of candidatePerk.offer_categories) {
    if (baseCategories.has(cat.name)) {
      score += 3;
    }
  }

  // Match deal_type
  if (
    basePerk.deal_type &&
    candidatePerk.deal_type &&
    basePerk.deal_type === candidatePerk.deal_type
  ) {
    score += 2;
  }

  // Match investment_levels
  const baseLevels = new Set(basePerk.investment_levels.map((l) => l.name));
  for (const level of candidatePerk.investment_levels) {
    if (baseLevels.has(level.name)) {
      score += 2;
    }
  }

  // Match vendor primary_service (strong signal for service area)
  if (
    baseVendorService &&
    candidateVendorService &&
    baseVendorService.toLowerCase() === candidateVendorService.toLowerCase()
  ) {
    score += 4;
  }

  return score;
}

/**
 * Find similar perks for a given offer
 *
 * @param currentPerk - The perk to find similar items for
 * @param allPerks - All available perks to search from
 * @param maxResults - Maximum number of results (default: 4)
 * @param vendorMap - Optional map of vendor IDs to vendor info (for primary_service matching)
 * @returns Array of similar perks, prioritizing different vendors
 */
export function findSimilarPerks(
  currentPerk: GetProvenDeal,
  allPerks: GetProvenDeal[],
  maxResults = 4,
  vendorMap?: Record<number, VendorInfo>
): GetProvenDeal[] {
  // Get current perk's vendor primary service
  const currentVendorService = vendorMap?.[currentPerk.vendor_id]?.primaryService;

  // Filter out current perk and calculate scores
  const scoredPerks: PerkSimilarityScore[] = allPerks
    .filter((perk) => perk.id !== currentPerk.id)
    .map((perk) => {
      const candidateVendorService = vendorMap?.[perk.vendor_id]?.primaryService;
      return {
        perk,
        score: calculatePerkSimilarity(
          currentPerk,
          perk,
          currentVendorService,
          candidateVendorService
        ),
        isDifferentVendor: perk.vendor_id !== currentPerk.vendor_id,
      };
    })
    .filter((item) => item.score > 0); // Only include perks with some similarity

  // Sort by:
  // 1. Different vendor first (prefer diversity)
  // 2. Higher similarity score
  scoredPerks.sort((a, b) => {
    // Prioritize different vendors
    if (a.isDifferentVendor !== b.isDifferentVendor) {
      return a.isDifferentVendor ? -1 : 1;
    }
    // Then by score
    return b.score - a.score;
  });

  // Return top results
  return scoredPerks.slice(0, maxResults).map((item) => item.perk);
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMILAR VENDORS
// ─────────────────────────────────────────────────────────────────────────────

interface VendorSimilarityScore {
  vendor: GetProvenVendor;
  score: number;
  perkCount: number;
}

/**
 * Calculate similarity score between two vendors
 *
 * Scoring:
 * - Shared services: +3 per match
 * - Shared industries: +2 per match
 * - Same primary_service: +4
 */
function calculateVendorSimilarity(
  baseVendor: GetProvenVendor,
  candidateVendor: GetProvenVendor
): number {
  let score = 0;

  // Match services (strongest signal)
  const baseServices = new Set(baseVendor.services.map((s) => s.name));
  for (const service of candidateVendor.services) {
    if (baseServices.has(service.name)) {
      score += 3;
    }
  }

  // Match industries
  const baseIndustries = new Set(baseVendor.industries.map((i) => i.name));
  for (const industry of candidateVendor.industries) {
    if (baseIndustries.has(industry.name)) {
      score += 2;
    }
  }

  // Match primary_service (exact match is strong signal)
  if (
    baseVendor.primary_service &&
    candidateVendor.primary_service &&
    baseVendor.primary_service.toLowerCase() ===
      candidateVendor.primary_service.toLowerCase()
  ) {
    score += 4;
  }

  return score;
}

/**
 * Count perks for each vendor
 */
function countPerksPerVendor(perks: GetProvenDeal[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const perk of perks) {
    counts.set(perk.vendor_id, (counts.get(perk.vendor_id) || 0) + 1);
  }
  return counts;
}

/**
 * Find similar vendors for a given vendor
 *
 * @param currentVendor - The vendor to find similar items for
 * @param allVendors - All available vendors to search from
 * @param allPerks - All perks (to filter out vendors with no perks)
 * @param maxResults - Maximum number of results (default: 4)
 * @returns Array of similar vendors that have active perks
 */
export function findSimilarVendors(
  currentVendor: GetProvenVendor,
  allVendors: GetProvenVendor[],
  allPerks: GetProvenDeal[],
  maxResults = 4
): GetProvenVendor[] {
  // Count perks per vendor
  const perkCounts = countPerksPerVendor(allPerks);

  // Filter out current vendor and vendors with no perks, calculate scores
  const scoredVendors: VendorSimilarityScore[] = allVendors
    .filter((vendor) => {
      // Exclude current vendor
      if (vendor.id === currentVendor.id) return false;
      // Exclude vendors with no active perks
      const perkCount = perkCounts.get(vendor.id) || 0;
      if (perkCount === 0) return false;
      return true;
    })
    .map((vendor) => ({
      vendor,
      score: calculateVendorSimilarity(currentVendor, vendor),
      perkCount: perkCounts.get(vendor.id) || 0,
    }))
    .filter((item) => item.score > 0); // Only include vendors with some similarity

  // Sort by score (higher first), then by perk count (more perks = more relevant)
  scoredVendors.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.perkCount - a.perkCount;
  });

  // Return top results
  return scoredVendors.slice(0, maxResults).map((item) => item.vendor);
}
