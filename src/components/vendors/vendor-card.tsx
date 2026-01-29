'use client';

/**
 * Vendor Card Component - MercuryOS Design System
 * Displays a single vendor from the GetProven API
 *
 * Design principles:
 * - Neutral grey backgrounds with soft borders
 * - Subtle shadows and smooth hover transitions
 * - Clean typography with proper hierarchy
 *
 * STRICT: Shows ONLY API-provided fields
 * - NO ratings or reviews
 * - NO popularity indicators
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, Users, Calendar, Gift } from 'lucide-react';
import type { GetProvenVendor } from '@/types';

interface VendorCardProps {
  vendor: GetProvenVendor;
  basePath?: string;
  perksCount?: number;
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
 * Truncate text to max length
 */
function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format employee range
 */
function formatEmployeeRange(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  if (min !== null && max !== null) {
    return `${min}-${max} employees`;
  }
  if (min !== null) {
    return `${min}+ employees`;
  }
  if (max !== null) {
    return `Up to ${max} employees`;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vendor Logo - MercuryOS neutral styling
 */
function VendorLogo({ src, alt }: { src: string | null; alt: string }) {
  const [error, setError] = useState(false);

  // Placeholder: no logo or load error
  if (!src || error) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
        <Building2 className="h-6 w-6 text-gray-400" aria-hidden="true" />
      </div>
    );
  }

  // Render actual vendor logo
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-50">
      <Image
        src={src}
        alt={alt}
        width={48}
        height={48}
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
  color: 'blue' | 'grey';
}) {
  const styles = {
    blue: 'bg-[#0038FF]/10 text-[#0038FF]',
    grey: 'bg-gray-100 text-gray-600',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ${styles[color]}`}
    >
      {text}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function VendorCard({ vendor, basePath = '/admin/vendors', perksCount }: VendorCardProps) {
  const description = truncate(stripHtml(vendor.description || ''), 120);
  const employeeRange = formatEmployeeRange(vendor.employee_min, vendor.employee_max);

  return (
    <Link
      href={`${basePath}/${vendor.id}`}
      className="group block min-w-0 overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white border border-gray-200/60 shadow-sm transition-all duration-200 ease-out group-hover:shadow-lg group-hover:border-gray-300/80 group-hover:-translate-y-1 group-hover:scale-[1.01]">

        {/* HEADER - Vendor info */}
        <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-2">
          <div className="flex items-center gap-2">
            <VendorLogo src={vendor.logo} alt={`${vendor.name} logo`} />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[15px] font-semibold text-gray-900">
                {vendor.name}
              </h3>
              {vendor.primary_service && (
                <p className="truncate text-[13px] text-gray-500">
                  {vendor.primary_service}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT - Main card body */}
        <div className="flex flex-1 flex-col gap-2 p-4">

          {/* Description */}
          {description && (
            <p className="line-clamp-2 text-[13px] text-gray-500 leading-relaxed">
              {description}
            </p>
          )}

          {/* Meta info row */}
          {(perksCount !== undefined || employeeRange || vendor.founded) && (
            <div className="flex flex-wrap items-center gap-4">
              {/* Perks count */}
              {perksCount !== undefined && (
                <span className="flex items-center gap-1 text-[12px] text-gray-500">
                  <Gift className="h-3.5 w-3.5" aria-hidden="true" />
                  {perksCount} {perksCount === 1 ? 'perk' : 'perks'}
                </span>
              )}

              {/* Employees */}
              {employeeRange && (
                <span className="flex items-center gap-1 text-[12px] text-gray-500">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {employeeRange}
                </span>
              )}

              {/* Founded */}
              {vendor.founded && (
                <span className="flex items-center gap-1 text-[12px] text-gray-500">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  Est. {vendor.founded}
                </span>
              )}
            </div>
          )}

          {/* Services */}
          {vendor.services.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-auto">
              {vendor.services.slice(0, 3).map((service, idx) => (
                <ColorLabel key={idx} text={service.name} color="grey" />
              ))}
              {vendor.services.length > 3 && (
                <span className="text-[11px] text-gray-400 ml-1">
                  +{vendor.services.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Vendor groups */}
          {vendor.vendor_groups.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {vendor.vendor_groups.map((group, idx) => (
                <ColorLabel key={idx} text={group.name} color="blue" />
              ))}
            </div>
          )}
        </div>

        {/* FOOTER - Action area */}
        <div className="flex items-center border-t border-gray-100 bg-gray-50/30 px-4 py-2">
          <span className="text-[13px] font-medium text-[#0038FF] group-hover:text-[#0030E0] transition-colors duration-200">
            View vendor
          </span>
          <svg className="ml-1 h-4 w-4 text-[#0038FF] group-hover:text-[#0030E0] group-hover:translate-x-0.5 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vendor Card Skeleton - MercuryOS loading state
 */
export function VendorCardSkeleton() {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl bg-white border border-gray-200/60 shadow-sm"
      aria-hidden="true"
    >
      {/* Header Section */}
      <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-2">
        <div className="flex items-center gap-2">
          {/* Logo placeholder */}
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-gray-100" />
          {/* Name placeholder */}
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Description lines */}
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-gray-100" />
        </div>

        {/* Meta info */}
        <div className="flex gap-4">
          <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
        </div>

        {/* Tag placeholders */}
        <div className="flex gap-1">
          <div className="h-5 w-16 animate-pulse rounded-md bg-gray-100" />
          <div className="h-5 w-20 animate-pulse rounded-md bg-gray-100" />
          <div className="h-5 w-14 animate-pulse rounded-md bg-gray-100" />
        </div>
      </div>

      {/* Footer Section */}
      <div className="flex items-center border-t border-gray-100 bg-gray-50/30 px-4 py-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-400" />
      </div>
    </div>
  );
}
