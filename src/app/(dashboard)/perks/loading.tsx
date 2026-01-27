/**
 * Perks Listing Page Loading Skeleton
 * MercuryOS Design System
 */

import { Gift } from 'lucide-react';

function SkeletonPulse({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200/60 ${className}`} />
  );
}

function OfferCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white border border-gray-200/60 shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <SkeletonPulse className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <SkeletonPulse className="h-4 w-28" />
            <SkeletonPulse className="h-3 w-20" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Label */}
        <SkeletonPulse className="h-5 w-14 rounded" />

        {/* Title */}
        <div className="space-y-2">
          <SkeletonPulse className="h-4 w-full" />
          <SkeletonPulse className="h-4 w-3/4" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <SkeletonPulse className="h-3 w-full" />
          <SkeletonPulse className="h-3 w-5/6" />
        </div>

        {/* Tags */}
        <div className="flex gap-2 pt-1 mt-auto">
          <SkeletonPulse className="h-6 w-16 rounded-md" />
          <SkeletonPulse className="h-6 w-20 rounded-md" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center border-t border-gray-100 bg-gray-50/30 px-4 py-2">
        <SkeletonPulse className="h-4 w-20" />
      </div>
    </div>
  );
}

export default function PerksLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0038FF] to-[#0030E0]">
            <Gift className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Discover Perks
          </h1>
        </div>
        <SkeletonPulse className="h-5 w-80" />
      </div>

      {/* Search & Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SkeletonPulse className="h-10 flex-1 rounded-lg" />
        <div className="flex items-center gap-2">
          <SkeletonPulse className="h-9 w-32 rounded-lg" />
          <SkeletonPulse className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <OfferCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
