'use client';

/**
 * Vendors Grid Component
 * Displays a grid of vendor cards with loading and empty states
 */

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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <VendorCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (vendors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-16">
        <p className="text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  // Grid of vendors
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
