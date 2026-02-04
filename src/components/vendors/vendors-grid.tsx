'use client';

/**
 * Vendors Grid Component
 * Displays a grid of vendor cards with loading and empty states
 */

import { Building2 } from 'lucide-react';
import { VendorCard, VendorCardSkeleton } from './vendor-card';
import type { GetProvenVendor } from '@/types';

interface VendorsGridProps {
  vendors: GetProvenVendor[];
  isLoading?: boolean;
  emptyMessage?: string;
  basePath?: string;
  perksCountMap?: Record<number, number>;
}

export function VendorsGrid({
  vendors,
  isLoading = false,
  emptyMessage = 'No vendors found',
  basePath = '/admin/vendors',
  perksCountMap,
}: VendorsGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <VendorCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (vendors.length === 0) {
    const isSearchResult = emptyMessage.includes('for "');
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/80 py-16 px-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 mb-4">
          <Building2 className="h-7 w-7 text-gray-400" />
        </div>
        <p className="text-[14px] text-gray-600 font-medium mb-1">
          {isSearchResult ? 'No matching vendors' : 'No vendors available'}
        </p>
        <p className="text-[13px] text-gray-400 text-center max-w-xs">
          {isSearchResult
            ? 'Try adjusting your search or filters'
            : 'Vendors will appear here once synced from the API'}
        </p>
      </div>
    );
  }

  // Grid of vendors
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {vendors.map((vendor) => (
        <VendorCard
          key={vendor.id}
          vendor={vendor}
          basePath={basePath}
          perksCount={perksCountMap?.[vendor.id]}
        />
      ))}
    </div>
  );
}
