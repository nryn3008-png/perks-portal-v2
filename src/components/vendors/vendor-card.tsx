'use client';

/**
 * Vendor Card Component
 * Displays a single vendor from the GetProven API
 *
 * STRICT: Shows ONLY API-provided fields
 * - NO ratings or reviews
 * - NO popularity indicators
 */

import Link from 'next/link';
import Image from 'next/image';
import { Building2, Users, Calendar, Gift } from 'lucide-react';
import type { GetProvenVendor } from '@/types';

interface VendorCardProps {
  vendor: GetProvenVendor;
  basePath?: string;
  perksCount?: number;
}

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

export function VendorCard({ vendor, basePath = '/admin/vendors', perksCount }: VendorCardProps) {
  const description = truncate(stripHtml(vendor.description || ''), 120);
  const employeeRange = formatEmployeeRange(vendor.employee_min, vendor.employee_max);

  return (
    <Link
      href={`${basePath}/${vendor.id}`}
      className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_3px_10px_0px_rgba(0,0,0,0.1)] transition-shadow group-hover:shadow-[0px_4px_14px_0px_rgba(0,0,0,0.15)]">
        {/* Header Section */}
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            {vendor.logo ? (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
                <Image
                  src={vendor.logo}
                  alt={`${vendor.name} logo`}
                  width={48}
                  height={48}
                  className="h-full w-full object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-slate-100">
                <Building2 className="h-6 w-6 text-slate-400" aria-hidden="true" />
              </div>
            )}

            {/* Name and Primary Service */}
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-mulish text-base font-bold leading-[22px] text-[#3d445a]">
                {vendor.name}
              </h3>
              {vendor.primary_service && (
                <p className="truncate font-mulish text-xs leading-[18px] tracking-[0.4px] text-[#81879c]">
                  {vendor.primary_service}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* Description */}
          {description && (
            <p className="line-clamp-2 font-mulish text-sm leading-5 tracking-[0.4px] text-[#676c7e]">
              {description}
            </p>
          )}

          {/* Meta info row */}
          {(perksCount !== undefined || employeeRange || vendor.founded) && (
            <div className="flex flex-wrap items-center gap-4">
              {/* Perks count */}
              {perksCount !== undefined && (
                <span className="flex items-center gap-1 font-mulish text-xs leading-[18px] tracking-[0.4px] text-[#81879c]">
                  <Gift className="h-4 w-4" aria-hidden="true" />
                  {perksCount} {perksCount === 1 ? 'perk' : 'perks'}
                </span>
              )}

              {/* Employees */}
              {employeeRange && (
                <span className="flex items-center gap-1 font-mulish text-xs leading-[18px] tracking-[0.4px] text-[#81879c]">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  {employeeRange}
                </span>
              )}

              {/* Founded */}
              {vendor.founded && (
                <span className="flex items-center gap-1 font-mulish text-xs leading-[18px] tracking-[0.4px] text-[#81879c]">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  Est. {vendor.founded}
                </span>
              )}
            </div>
          )}

          {/* Services */}
          {vendor.services.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {vendor.services.slice(0, 3).map((service, idx) => (
                <span
                  key={idx}
                  className="inline-flex rounded border border-[#ecedf0] bg-[#f9f9fa] px-2 py-0 font-mulish text-sm font-semibold leading-6 tracking-[0.4px] text-[#3d445a]"
                >
                  {service.name}
                </span>
              ))}
              {vendor.services.length > 3 && (
                <span className="font-mulish text-xs leading-[18px] tracking-[0.4px] text-[#676c7e]">
                  +{vendor.services.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Vendor groups */}
          {vendor.vendor_groups.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {vendor.vendor_groups.map((group, idx) => (
                <span
                  key={idx}
                  className="inline-flex rounded border border-[#e6eeff] bg-[#eef4ff] px-2 py-0 font-mulish text-sm font-semibold leading-6 tracking-[0.4px] text-[#0036d7]"
                >
                  {group.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="border-t border-slate-100 p-4">
          <span className="font-mulish text-sm font-semibold leading-6 tracking-[0.4px] text-[#0038ff]">
            View vendor
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Vendor Card Skeleton for loading state
 */
export function VendorCardSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_3px_10px_0px_rgba(0,0,0,0.1)]"
      aria-hidden="true"
    >
      {/* Header Section */}
      <div className="border-b border-slate-100 p-4">
        <div className="flex items-center gap-4">
          {/* Logo placeholder */}
          <div className="h-12 w-12 shrink-0 rounded bg-[#ecedf0]" />
          {/* Name placeholder */}
          <div className="h-4 w-[154px] rounded-full bg-[#e6e8ed]" />
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Short line */}
        <div className="h-4 w-16 rounded-full bg-[#e6e8ed]" />

        {/* Description lines */}
        <div className="flex flex-col gap-1">
          <div className="h-3.5 w-full rounded-full bg-[#e6e8ed]" />
          <div className="h-3.5 w-full rounded-full bg-[#e6e8ed]" />
        </div>

        {/* More skeleton lines */}
        <div className="flex flex-col gap-1">
          <div className="h-3.5 w-[272px] max-w-full rounded-full bg-[#e6e8ed]" />
          <div className="h-3.5 w-[249px] max-w-full rounded-full bg-[#e6e8ed]" />
          <div className="h-3.5 w-[113px] rounded-full bg-[#e6e8ed]" />
        </div>

        {/* Tag placeholders */}
        <div className="h-4 w-[154px] rounded-full bg-[#e6e8ed]" />
        <div className="h-4 w-[154px] rounded-full bg-[#e6e8ed]" />
      </div>

      {/* Footer Section */}
      <div className="flex h-14 items-center border-t border-slate-100 p-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-400" />
      </div>
    </div>
  );
}
