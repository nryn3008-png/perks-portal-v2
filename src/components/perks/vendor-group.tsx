'use client';

/**
 * Vendor Group Component
 *
 * Displays a collapsible group of offers from a single vendor.
 * Used in the "Group by Vendor" view on the All Perks page.
 *
 * Features:
 * - Collapsible/expandable with smooth animation
 * - Vendor header with logo, name, primary service, and offer count
 * - Grid of OfferCards when expanded
 * - Collapsed by default to reduce cognitive load
 */

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { OfferCard } from './offer-card';
import type { GetProvenDeal } from '@/types';

interface VendorGroupProps {
  vendorId: number;
  vendorName: string;
  vendorLogo: string | null;
  vendorPrimaryService?: string | null;
  offers: GetProvenDeal[];
  defaultExpanded?: boolean;
}

/**
 * Placeholder Gift Icon - MercuryOS neutral styling
 */
function PlaceholderGiftIcon() {
  return (
    <svg
      width="24"
      height="24"
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
 * Vendor Logo for group header - MercuryOS styling
 */
function VendorGroupLogo({ src }: { src: string | null }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
        <PlaceholderGiftIcon />
      </div>
    );
  }

  return (
    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gray-50">
      <Image
        src={src}
        alt=""
        width={36}
        height={36}
        className="h-full w-full object-contain"
        unoptimized
        onError={() => setError(true)}
      />
    </div>
  );
}

export function VendorGroup({
  vendorId,
  vendorName,
  vendorLogo,
  vendorPrimaryService,
  offers,
  defaultExpanded = false,
}: VendorGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const offerCount = offers.length;
  const headerId = `vendor-group-header-${vendorId}`;
  const contentId = `vendor-group-content-${vendorId}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Clickable Header */}
      <button
        id={headerId}
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className="flex w-full items-center gap-2 p-4 text-left transition-colors duration-150 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500/40"
      >
        {/* Vendor Logo */}
        <VendorGroupLogo src={vendorLogo} />

        {/* Vendor Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[14px] font-semibold text-gray-900">
              {vendorName}
            </h3>
            <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
              {offerCount} {offerCount === 1 ? 'perk' : 'perks'}
            </span>
          </div>
          {vendorPrimaryService && (
            <p className="truncate text-[13px] text-gray-500">
              {vendorPrimaryService}
            </p>
          )}
        </div>

        {/* Expand/Collapse Icon */}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-150 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Collapsible Content */}
      <div
        id={contentId}
        role="region"
        aria-labelledby={headerId}
        className={`transition-all duration-150 ease-out ${
          isExpanded ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        {isExpanded && (
          <div className="border-t border-gray-100 bg-gray-50/50 p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 justify-items-start">
              {offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  vendorLogo={vendorLogo}
                  vendorName={vendorName}
                  vendorPrimaryService={vendorPrimaryService}
                  className="w-full"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
