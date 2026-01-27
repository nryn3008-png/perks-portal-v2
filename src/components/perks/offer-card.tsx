'use client';

/**
 * Offer Card Component - MercuryOS Design System
 * Clean, grey-themed cards with subtle styling
 *
 * Design principles:
 * - Neutral grey backgrounds with soft borders
 * - Subtle shadows and smooth hover transitions
 * - Clean typography with proper hierarchy
 *
 * API fields mapped:
 * - name → title
 * - description → description text
 * - picture → vendor logo
 * - deal_type → label text
 * - discount + discount_type → green discount badge
 * - estimated_value → value badge
 * - old_price + new_price → price strikethrough
 * - investment_levels[] → grey badges
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import type { GetProvenDeal } from '@/types';

interface OfferCardProps {
  offer: GetProvenDeal;
  vendorLogo?: string | null;           // Logo from vendors API (takes precedence over offer.picture)
  vendorName?: string;                  // Vendor name from vendors API
  vendorPrimaryService?: string | null; // Primary service from vendors API
  isLoading?: boolean;
  className?: string;                   // Additional CSS classes for the card wrapper
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip HTML tags from description
 */
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Format discount for display
 */
function formatDiscount(discount: number | null, discountType: string | null): string | null {
  if (discount === null) return null;
  if (discountType === 'percentage') {
    return `${discount}% off`;
  }
  return `$${discount.toLocaleString()} off`;
}

/**
 * Format estimated value for display
 * Returns null for missing or zero values to avoid misleading "$0 value" displays
 */
function formatEstimatedValue(value: number | null): string | null {
  if (value === null || value === 0) return null;
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}K value`;
  }
  return `$${value.toLocaleString()} value`;
}

/**
 * Get deal type label (uppercased)
 */
function getDealTypeLabel(dealType: string | null): string {
  if (!dealType) return 'OFFER';
  return dealType.toUpperCase().replace('_', ' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS (matching Figma design system)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Placeholder Gift Icon - MercuryOS neutral styling
 */
function PlaceholderGiftIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 7V22M12 7H8.46429C7.94332 7 7.4437 6.79018 7.07544 6.41421C6.70718 6.03824 6.5 5.52826 6.5 5C6.5 4.47174 6.70718 3.96176 7.07544 3.58579C7.4437 3.20982 7.94332 3 8.46429 3C11.2143 3 12 7 12 7ZM12 7H15.5357C16.0567 7 16.5563 6.79018 16.9246 6.41421C17.2928 6.03824 17.5 5.52826 17.5 5C17.5 4.47174 17.2928 3.96176 16.9246 3.58579C16.5563 3.20982 16.0567 3 15.5357 3C12.7857 3 12 7 12 7ZM5 12H19M5 12C4.46957 12 3.96086 11.7893 3.58579 11.4142C3.21071 11.0391 3 10.5304 3 10V9C3 8.46957 3.21071 7.96086 3.58579 7.58579C3.96086 7.21071 4.46957 7 5 7H19C19.5304 7 20.0391 7.21071 20.4142 7.58579C20.7893 7.96086 21 8.46957 21 9V10C21 10.5304 20.7893 11.0391 20.4142 11.4142C20.0391 11.7893 19.5304 12 19 12M5 12V20C5 20.5304 5.21071 21.0391 5.58579 21.4142C5.96086 21.7893 6.46957 22 7 22H17C17.5304 22 18.0391 21.7893 18.4142 21.4142C18.7893 21.0391 19 20.5304 19 20V12"
        stroke="#a3a3a3"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Vendor Logo - MercuryOS neutral styling
 */
function VendorLogo({ src }: { src: string | null }) {
  const [error, setError] = useState(false);

  // Placeholder: no logo or load error
  if (!src || error) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
        <PlaceholderGiftIcon />
      </div>
    );
  }

  // Render actual vendor logo
  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-50">
      <Image
        src={src}
        alt=""
        width={40}
        height={40}
        className="h-full w-full object-contain"
        unoptimized
        onError={() => setError(true)}
      />
    </div>
  );
}

/**
 * Color Label Badge - MercuryOS styling
 */
function ColorLabel({
  text,
  color,
}: {
  text: string;
  color: 'green' | 'blue' | 'grey';
}) {
  const styles = {
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-[#0038FF]/10 text-[#0038FF]',
    grey: 'bg-gray-100 text-gray-600',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${styles[color]}`}
    >
      {text}
    </span>
  );
}

/**
 * Skeleton Loader - MercuryOS styling
 * Exported for use in loading states
 */
export function OfferCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-gray-50 border border-gray-100">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white p-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-gray-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 bg-white p-4">
        {/* Label */}
        <div className="h-5 w-14 animate-pulse rounded bg-gray-100" />

        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-gray-50" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-gray-50" />
        </div>

        {/* Tags */}
        <div className="flex gap-2 pt-1">
          <div className="h-6 w-16 animate-pulse rounded bg-gray-100" />
          <div className="h-6 w-20 animate-pulse rounded bg-gray-100" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center border-t border-gray-100 bg-gray-50 px-4 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function OfferCard({ offer, vendorLogo, vendorName, vendorPrimaryService, isLoading = false, className = '' }: OfferCardProps) {
  // Loading state → Figma "loading" variant
  if (isLoading) {
    return <OfferCardSkeleton />;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVE FIGMA PROPS FROM API DATA
  // ─────────────────────────────────────────────────────────────────────────

  // API field extraction
  const name = offer.name;
  const description = stripHtml(offer.description);
  // Use vendor logo from vendors API (if provided), fallback to offer.picture
  const picture = vendorLogo ?? offer.picture;
  const dealType = offer.deal_type;
  const discount = offer.discount;
  const discountType = offer.discount_type;
  const estimatedValue = offer.estimated_value;
  const oldPrice = offer.old_price;
  const newPrice = offer.new_price;
  const investmentLevels = offer.investment_levels || [];

  // Figma prop derivation (based on data availability)
  const showDescription = Boolean(description);
  const discountValue = discount !== null;
  const priceValue = estimatedValue !== null && estimatedValue > 0;
  const priceDifference = oldPrice !== null && newPrice !== null;
  const valueTag = discountValue || priceValue;

  // Formatted display values
  const formattedDiscount = formatDiscount(discount, discountType);
  const formattedValue = formatEstimatedValue(estimatedValue);
  const dealTypeLabel = getDealTypeLabel(dealType);

  // Investment levels display (max 5 visible + count)
  const visibleLevels = investmentLevels.slice(0, 5);
  const remainingCount = Math.max(0, investmentLevels.length - 5);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER - MercuryOS Art Direction: minimal, premium, motion-forward
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Link
      href={`/perks/${offer.id}`}
      className={`group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 ${className}`}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white border border-gray-200/60 shadow-sm transition-all duration-200 ease-out group-hover:shadow-lg group-hover:border-gray-300/80 group-hover:-translate-y-1 group-hover:scale-[1.01]">

        {/* HEADER - Vendor info */}
        <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-2">
          <div className="flex items-center gap-2">
            <VendorLogo src={picture} />
            {vendorName && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {vendorName}
                </p>
                {vendorPrimaryService && (
                  <p className="truncate text-xs text-gray-500">
                    {vendorPrimaryService}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CONTENT - Main card body */}
        <div className="flex flex-1 flex-col gap-2 p-4">

          {/* Deal type label */}
          <div className="inline-flex w-fit items-center rounded bg-gray-100 px-2 py-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              {dealTypeLabel}
            </span>
          </div>

          {/* Title & Description */}
          <div className="flex flex-col gap-1">
            <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900">
              {name}
            </h3>

            {showDescription && (
              <p className="line-clamp-2 text-sm text-gray-500 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Value Tags Section */}
          {valueTag && (
            <div className="flex flex-col gap-2 mt-auto">
              <div className="flex flex-wrap gap-1">
                {discountValue && formattedDiscount && (
                  <ColorLabel text={formattedDiscount} color="green" />
                )}

                {priceValue && formattedValue && (
                  <ColorLabel text={formattedValue} color="blue" />
                )}
              </div>

              {priceDifference && (
                <p className="text-sm font-semibold text-gray-900">
                  <span className="text-gray-400 line-through">
                    ${oldPrice!.toLocaleString()}
                  </span>{' '}
                  ${newPrice!.toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Investment Levels */}
          {investmentLevels.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-auto pt-1">
              {visibleLevels.map((level, idx) => (
                <ColorLabel key={idx} text={level.name} color="grey" />
              ))}
              {remainingCount > 0 && (
                <span className="text-xs text-gray-400 ml-0.5">
                  +{remainingCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* FOOTER - Action area */}
        <div className="flex items-center border-t border-gray-100 bg-gray-50/30 px-4 py-2">
          <span className="text-sm font-medium text-[#0038FF] group-hover:text-[#0030E0] transition-colors duration-200">
            View offer
          </span>
          <svg className="ml-1 h-4 w-4 text-[#0038FF] group-hover:text-[#0030E0] group-hover:translate-x-0.5 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
