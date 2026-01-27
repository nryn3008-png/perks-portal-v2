'use client';

/**
 * Offers Grid Component
 * Displays a grid of offer cards with loading and empty states.
 * Supports two view modes:
 * - Flat grid (default): Shows all offers in a simple grid
 * - Grouped by vendor: Shows offers organized by vendor with collapsible sections
 */

import { useMemo } from 'react';
import { OfferCard, OfferCardSkeleton } from './offer-card';
import { VendorGroup } from './vendor-group';
import type { GetProvenDeal } from '@/types';

interface VendorInfo {
  logo: string | null;
  name: string;
  primaryService?: string | null;
}

interface OffersGridProps {
  offers: GetProvenDeal[];
  vendorMap?: Record<number, VendorInfo>;
  isLoading?: boolean;
  emptyMessage?: string;
  /** When true, groups offers by vendor with collapsible sections */
  groupByVendor?: boolean;
}

interface VendorGroupData {
  vendorId: number;
  vendorName: string;
  vendorLogo: string | null;
  vendorPrimaryService?: string | null;
  offers: GetProvenDeal[];
}

export function OffersGrid({
  offers,
  vendorMap = {},
  isLoading = false,
  emptyMessage = 'No perks available',
  groupByVendor = false,
}: OffersGridProps) {
  // Group offers by vendor_id - memoized to avoid recalculation
  const vendorGroups = useMemo((): VendorGroupData[] => {
    if (!groupByVendor) return [];

    // Group offers by vendor_id
    const groupMap = new Map<number, GetProvenDeal[]>();
    for (const offer of offers) {
      const vendorId = offer.vendor_id;
      if (!groupMap.has(vendorId)) {
        groupMap.set(vendorId, []);
      }
      groupMap.get(vendorId)!.push(offer);
    }

    // Convert to array with vendor info, sorted by vendor name
    const groups: VendorGroupData[] = [];
    for (const [vendorId, vendorOffers] of Array.from(groupMap.entries())) {
      const vendorInfo = vendorMap[vendorId];
      groups.push({
        vendorId,
        vendorName: vendorInfo?.name || `Vendor ${vendorId}`,
        vendorLogo: vendorInfo?.logo || null,
        vendorPrimaryService: vendorInfo?.primaryService,
        offers: vendorOffers,
      });
    }

    // Sort by vendor name alphabetically
    groups.sort((a, b) => a.vendorName.localeCompare(b.vendorName));

    return groups;
  }, [offers, vendorMap, groupByVendor]);

  // Loading state - use OfferCardSkeleton for better visual consistency
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <OfferCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state - check both offers array and vendorGroups for grouped view
  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-16">
        <p className="text-[14px] text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // Also return empty state if vendorGroups is empty in grouped view
  if (groupByVendor && vendorGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-16">
        <p className="text-[14px] text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // Grouped view - vendor sections with collapsible headers
  if (groupByVendor) {
    return (
      <div className="space-y-4">
        {vendorGroups.map((group) => (
          <VendorGroup
            key={group.vendorId}
            vendorId={group.vendorId}
            vendorName={group.vendorName}
            vendorLogo={group.vendorLogo}
            vendorPrimaryService={group.vendorPrimaryService}
            offers={group.offers}
          />
        ))}
      </div>
    );
  }

  // Flat grid view (default)
  return (
    <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer) => {
        const vendor = vendorMap[offer.vendor_id];
        return (
          <OfferCard
            key={offer.id}
            offer={offer}
            vendorLogo={vendor?.logo}
            vendorName={vendor?.name}
            vendorPrimaryService={vendor?.primaryService}
            className="w-full"
          />
        );
      })}
    </div>
  );
}
