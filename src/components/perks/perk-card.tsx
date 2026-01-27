/**
 * Perk Card component - MercuryOS Design System
 * Displays a perk in the listing grid
 * Hardened for real-world API data with graceful fallbacks
 *
 * Icon sourcing priority:
 * 1. provider.logo (if available from API)
 * 2. provider.faviconUrl (derived from vendor website domain)
 * 3. Provider initial letter (fallback)
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPerkValue, formatCurrency } from '@/lib/utils';
import type { PerkListItem } from '@/types';

interface PerkCardProps {
  perk: PerkListItem;
  isLoading?: boolean;
}

/**
 * Vendor icon component with fallback chain:
 * logo -> favicon -> initial letter
 */
function VendorIcon({
  logo,
  faviconUrl,
  providerName,
}: {
  logo?: string;
  faviconUrl?: string;
  providerName: string;
}) {
  const [imageError, setImageError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  const initial = providerName.charAt(0).toUpperCase();

  // Determine which image source to use
  const showLogo = logo && !imageError;
  const showFavicon = !showLogo && faviconUrl && !faviconError;
  const showInitial = !showLogo && !showFavicon;

  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100"
      aria-hidden="true"
    >
      {showLogo && (
        <Image
          src={logo}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
          loading="lazy"
          unoptimized={logo.startsWith('/')}
          onError={() => setImageError(true)}
        />
      )}
      {showFavicon && (
        <Image
          src={faviconUrl}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
          loading="lazy"
          unoptimized
          onError={() => setFaviconError(true)}
        />
      )}
      {showInitial && (
        <span className="text-lg font-semibold text-gray-400">
          {initial}
        </span>
      )}
    </div>
  );
}

/**
 * Skeleton loader for PerkCard
 */
function PerkCardSkeleton() {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm">
      {/* Header skeleton */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex gap-4">
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-gray-100" />
          <div className="flex flex-1 flex-col justify-center gap-2">
            <div className="h-3.5 w-32 animate-pulse rounded-full bg-gray-100" />
            <div className="h-3 w-48 animate-pulse rounded-full bg-gray-100" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex flex-col gap-4 p-4">
        <div className="h-4 w-56 animate-pulse rounded-full bg-gray-100" />
        <div className="flex flex-col gap-1">
          <div className="h-3.5 w-full animate-pulse rounded-full bg-gray-100" />
          <div className="h-3.5 w-full animate-pulse rounded-full bg-gray-100" />
          <div className="h-3.5 w-28 animate-pulse rounded-full bg-gray-100" />
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="flex h-14 items-center border-t border-gray-100 p-4">
        <div className="h-6 w-6 animate-pulse rounded-full bg-gray-100" />
      </div>
    </div>
  );
}

/**
 * Value badge component for displaying discount/value labels
 */
function ValueBadge({
  text,
  variant = 'green',
}: {
  text: string;
  variant?: 'green' | 'blue';
}) {
  const variants = {
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-indigo-50 text-indigo-700',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {text}
    </span>
  );
}

/**
 * Get the value type label for display
 */
function getValueTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    percentage: 'Discount',
    fixed: 'Savings',
    credits: 'Credits',
    custom: 'Offer',
  };
  return labels[type] || 'Offer';
}

export function PerkCard({ perk, isLoading = false }: PerkCardProps) {
  if (isLoading) {
    return <PerkCardSkeleton />;
  }

  // Safely get provider name with fallback
  const providerName = perk.provider?.name?.trim() || 'Unknown Provider';

  // Safely get description with fallback
  const description =
    perk.shortDescription?.trim() || 'No description available';

  // Safely format value with fallback
  const formattedValue = perk.value
    ? formatPerkValue(perk.value)
    : 'Special offer';

  // Get the value type label (e.g., "Discount", "Credits")
  const valueTypeLabel = perk.value?.type
    ? getValueTypeLabel(perk.value.type)
    : 'Offer';

  // Get category name for services display
  const categoryName = perk.category?.name || '';

  // Calculate secondary value badge (e.g., "$3K value")
  const secondaryValue =
    perk.value?.amount && perk.value?.type === 'credits'
      ? formatCurrency(perk.value.amount, perk.value.currency)
      : null;

  return (
    <Link
      href={`/perks/${perk.slug}`}
      className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2"
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-white border border-gray-200/60 shadow-sm transition-all duration-200 ease-out group-hover:shadow-lg group-hover:border-gray-300/80 group-hover:-translate-y-1">
        {/* Header with vendor info */}
        <div className="border-b border-gray-100 bg-gray-50/50 p-4">
          <div className="flex gap-4">
            <VendorIcon
              logo={perk.provider?.logo}
              faviconUrl={perk.provider?.faviconUrl}
              providerName={providerName}
            />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
              <h3 className="text-sm font-semibold leading-5 text-gray-900">
                {providerName}
              </h3>
              {categoryName && (
                <p className="truncate text-xs text-gray-500">
                  {categoryName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          {/* Value type label */}
          <span className="inline-flex w-fit items-center rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {valueTypeLabel}
          </span>

          {/* Title and description */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-[15px] font-semibold leading-snug text-gray-900 line-clamp-2">
              {perk.title || 'Untitled Perk'}
            </h4>
            <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
              {description}
            </p>
          </div>

          {/* Value badges */}
          <div className="flex flex-wrap gap-1.5 mt-auto">
            <ValueBadge text={formattedValue} variant="green" />
            {secondaryValue && (
              <ValueBadge text={`${secondaryValue} value`} variant="blue" />
            )}
          </div>
        </div>

        {/* Footer with action */}
        <div className="border-t border-gray-100 bg-gray-50/30 px-4 py-3">
          <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700 transition-colors duration-150">
            View offer
          </span>
        </div>
      </div>
    </Link>
  );
}
