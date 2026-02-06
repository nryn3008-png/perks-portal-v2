'use client';

/**
 * Admin Vendors Page - MercuryOS Design System
 *
 * ADMIN ONLY: Manage vendors via GetProven API
 * - Fetches all vendors at once for complete search coverage
 * - Filter by search, service_name, group_name
 * - Mercury OS styling with Bridge Blue (#0038FF)
 */

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { AlertCircle, X, LayoutGrid, List, Building2, Gift, Users, Calendar, ChevronDown, Check, Filter } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Card, SearchInput } from '@/components/ui';
import { VendorsGrid } from '@/components/vendors';

import type { GetProvenVendor } from '@/types';
import { logger } from '@/lib/logger';

/**
 * Filter Dropdown Component
 * Mercury OS-style dropdown with checkmarks for selected items
 */
function FilterDropdown({
  label,
  options,
  selected,
  onSelect,
  onClear,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  onClear: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasSelection = selected !== '';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-1 rounded-full px-3 py-2 text-[13px] font-medium
          border transition-all duration-150
          ${hasSelection
            ? 'border-[#0038FF]/20 bg-[#0038FF]/5 text-[#0038FF]'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
          }
        `}
      >
        <Filter className="h-3.5 w-3.5" />
        <span>{hasSelection ? selected : label}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[200px] max-h-[300px] overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg animate-fade-in">
          {/* All option */}
          <button
            type="button"
            onClick={() => {
              onClear();
              setIsOpen(false);
            }}
            className={`
              flex w-full items-center gap-2 px-2 py-2 text-left text-[13px]
              transition-colors duration-100
              ${!hasSelection ? 'text-gray-900' : 'text-gray-600 hover:bg-gray-50'}
            `}
          >
            {!hasSelection && <Check className="h-3.5 w-3.5 text-[#0038FF]" />}
            {hasSelection && <span className="w-3.5" />}
            <span>All {label.toLowerCase()}</span>
          </button>

          <div className="my-1 border-t border-gray-100" />

          {/* Options */}
          {options.map((option) => {
            const isSelected = selected === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
                className={`
                  flex w-full items-center gap-2 px-2 py-2 text-left text-[13px]
                  transition-colors duration-100
                  ${isSelected ? 'text-gray-900' : 'text-gray-600 hover:bg-gray-50'}
                `}
              >
                {isSelected && <Check className="h-3.5 w-3.5 text-[#0038FF]" />}
                {!isSelected && <span className="w-3.5" />}
                <span className="truncate">{option}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type ViewMode = 'card' | 'table';

const PAGE_SIZE = 1000;

interface FilterOptions {
  services: string[];
  vendorGroups: string[];
}

interface ActiveFilters {
  serviceName: string;
  groupName: string;
}

/**
 * Format employee range
 */
function formatEmployeeRange(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  if (min !== null && max !== null) {
    return `${min}-${max}`;
  }
  if (min !== null) {
    return `${min}+`;
  }
  if (max !== null) {
    return `Up to ${max}`;
  }
  return null;
}

/**
 * Vendors Table Component - Mercury OS style
 */
interface VendorsTableProps {
  vendors: GetProvenVendor[];
  isLoading?: boolean;
  emptyMessage?: string;
  basePath?: string;
  perksCountMap?: Record<number, number>;
}

function VendorsTable({
  vendors,
  isLoading = false,
  emptyMessage = 'No vendors found',
  basePath = '/admin/vendors',
  perksCountMap,
}: VendorsTableProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50/50">
            <tr>
              <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Vendor</th>
              <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Primary Service</th>
              <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Perks</th>
              <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Employees</th>
              <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Founded</th>
              <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Services</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <tr key={i}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 animate-pulse" />
                    <div className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
                  </div>
                </td>
                <td className="px-4 py-4"><div className="h-4 w-24 rounded bg-gray-100 animate-pulse" /></td>
                <td className="px-4 py-4"><div className="h-4 w-12 rounded bg-gray-100 animate-pulse" /></td>
                <td className="px-4 py-4"><div className="h-4 w-16 rounded bg-gray-100 animate-pulse" /></td>
                <td className="px-4 py-4"><div className="h-4 w-12 rounded bg-gray-100 animate-pulse" /></td>
                <td className="px-4 py-4"><div className="h-4 w-40 rounded bg-gray-100 animate-pulse" /></td>
              </tr>
            ))}
          </tbody>
        </table>
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

  // Table view
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50/50">
            <tr>
              <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Vendor</th>
              <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Primary Service</th>
              <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Perks</th>
              <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Employees</th>
              <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Founded</th>
              <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Services</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vendors.map((vendor) => {
              const employeeRange = formatEmployeeRange(vendor.employee_min, vendor.employee_max);
              const perksCount = perksCountMap?.[vendor.id];

              return (
                <tr
                  key={vendor.id}
                  className="transition-colors hover:bg-gray-50/50"
                >
                  <td className="px-4 py-4">
                    <Link
                      href={`${basePath}/${vendor.id}`}
                      className="flex items-center gap-4 group"
                    >
                      {/* Logo */}
                      {vendor.logo ? (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                          <Image
                            src={vendor.logo}
                            alt={`${vendor.name} logo`}
                            width={40}
                            height={40}
                            className="h-full w-full object-contain"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                          <Building2 className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900 group-hover:text-[#0038FF] transition-colors">
                        {vendor.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-[13px] text-gray-600">
                    {vendor.primary_service || vendor.services?.[0]?.name || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-4">
                    {perksCount !== undefined ? (
                      <span className="inline-flex items-center gap-1 text-[13px] text-gray-600">
                        <Gift className="h-3.5 w-3.5 text-gray-400" />
                        {perksCount}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {employeeRange ? (
                      <span className="inline-flex items-center gap-1 text-[13px] text-gray-600">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        {employeeRange}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {vendor.founded ? (
                      <span className="inline-flex items-center gap-1 text-[13px] text-gray-600">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {vendor.founded}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {vendor.services.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {vendor.services.slice(0, 2).map((service, idx) => (
                          <span
                            key={idx}
                            className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[12px] text-gray-600"
                          >
                            {service.name}
                          </span>
                        ))}
                        {vendor.services.length > 2 && (
                          <span className="text-[12px] text-gray-400">
                            +{vendor.services.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminVendorsPageContent() {
  // Data state
  const [vendors, setVendors] = useState<GetProvenVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [perksCountMap, setPerksCountMap] = useState<Record<number, number>>({});

  // Filter state
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    services: [],
    vendorGroups: [],
  });
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    serviceName: '',
    groupName: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  // Fetch filter options from API
  const fetchFilterOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/vendors/filters');
      if (!res.ok) return;
      const data = await res.json();
      setFilterOptions(data);
    } catch (err) {
      logger.error('Failed to fetch filter options:', err);
    }
  }, []);

  // Fetch perks to count per vendor
  const fetchPerksCount = useCallback(async () => {
    try {
      const res = await fetch('/api/perks?page_size=1000');
      if (!res.ok) return;
      const data = await res.json();
      const perks = data.data || [];

      // Build count map: vendor_id -> number of perks
      const countMap: Record<number, number> = {};
      for (const perk of perks) {
        if (perk.vendor_id) {
          countMap[perk.vendor_id] = (countMap[perk.vendor_id] || 0) + 1;
        }
      }
      setPerksCountMap(countMap);
    } catch (err) {
      logger.error('Failed to fetch perks count:', err);
    }
  }, []);

  // Fetch all vendors at once for complete search coverage
  const fetchVendors = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('page_size', String(PAGE_SIZE));

      if (activeFilters.serviceName) {
        params.set('service_name', activeFilters.serviceName);
      }
      if (activeFilters.groupName) {
        params.set('group_name', activeFilters.groupName);
      }

      const url = `/api/vendors?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch vendors');

      const data = await res.json();
      const fetchedVendors: GetProvenVendor[] = data.data || [];
      setVendors(fetchedVendors);

      // Sync is handled by a separate useEffect that waits for perksCountMap
    } catch (err) {
      logger.error('Vendors fetch error:', err);
      setError('Something went wrong loading vendors. Hit retry or refresh the page.');
      setVendors([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters]);

  // Initial fetch
  useEffect(() => {
    fetchFilterOptions();
    fetchPerksCount();
  }, [fetchFilterOptions, fetchPerksCount]);

  // Fetch vendors when filters change
  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Sync vendors with Supabase once both vendors and perks count are loaded
  useEffect(() => {
    if (vendors.length === 0 || Object.keys(perksCountMap).length === 0) return;

    fetch('/api/vendors/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendors: vendors.map((v) => ({
          vendor_id: v.id,
          vendor_name: v.name || '',
          primary_service: v.primary_service || v.services?.[0]?.name || null,
          website: v.website || null,
          perks_count: perksCountMap[v.id] || 0,
        })),
      }),
    }).catch((error) => { if (process.env.NODE_ENV === 'development') logger.error('Vendor sync failed:', error); });
  }, [vendors, perksCountMap]);

  // Clear search (client-side only)
  const clearSearch = () => {
    setSearchInput('');
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchInput('');
    setActiveFilters({
      serviceName: '',
      groupName: '',
    });
  };

  // Check if search is active (client-side filtering)
  const isSearchActive = searchInput.trim().length > 0;

  const hasActiveFilters =
    activeFilters.serviceName !== '' ||
    activeFilters.groupName !== '';

  // Client-side search filtering (filters as user types)
  const finalVendors = isSearchActive
    ? vendors.filter((vendor) =>
        vendor.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        ((vendor.primary_service || vendor.services?.[0]?.name || '').toLowerCase().includes(searchInput.toLowerCase()))
      )
    : vendors;

  const hasFilterOptions =
    filterOptions.services.length > 0 ||
    filterOptions.vendorGroups.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0038FF] to-[#0030E0]">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Vendors Management
          </h1>
        </div>
        <p className="text-[14px] text-gray-500 max-w-2xl">
          Browse all vendors and their available perks.
        </p>
      </div>

      {/* Search & Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          className="flex-1"
          placeholder="Search vendors by name or service..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onClear={clearSearch}
          aria-label="Search vendors"
        />

        <div className="flex items-center gap-2">
          {/* Filter Dropdowns */}
          {filterOptions.services.length > 0 && (
            <FilterDropdown
              label="Service"
              options={filterOptions.services.slice(0, 20)}
              selected={activeFilters.serviceName}
              onSelect={(value) => setActiveFilters(prev => ({ ...prev, serviceName: value }))}
              onClear={() => setActiveFilters(prev => ({ ...prev, serviceName: '' }))}
            />
          )}

          {filterOptions.vendorGroups.length > 0 && (
            <FilterDropdown
              label="Group"
              options={filterOptions.vendorGroups}
              selected={activeFilters.groupName}
              onSelect={(value) => setActiveFilters(prev => ({ ...prev, groupName: value }))}
              onClear={() => setActiveFilters(prev => ({ ...prev, groupName: '' }))}
            />
          )}

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />

          {/* View mode toggle */}
          <div className="flex rounded-full border border-gray-200 bg-gray-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-[13px] font-medium transition-all duration-150 ${
                viewMode === 'card'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label="Card view"
              aria-pressed={viewMode === 'card'}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-[13px] font-medium transition-all duration-150 ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label="Table view"
              aria-pressed={viewMode === 'table'}
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" aria-hidden="true" />
            <p className="text-[14px] text-red-700">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchVendors()}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Results */}
      <div>
        {/* Active filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2" aria-live="polite">
          {isSearchActive && !isLoading && (
            <span className="text-[13px] text-gray-400">
              {`${finalVendors.length} of ${vendors.length} matching "${searchInput}"`}
            </span>
          )}

          {/* Active filter pills */}
          {hasActiveFilters && !isLoading && (
            <>
              {isSearchActive && <span className="text-[13px] text-gray-300">•</span>}
              <span className="text-[12px] text-gray-400">Filtered by:</span>
              {activeFilters.serviceName && (
                <button
                  onClick={() => setActiveFilters(prev => ({ ...prev, serviceName: '' }))}
                  className="inline-flex items-center gap-1 rounded-full bg-[#0038FF]/10 px-2 py-0.5 text-[12px] font-medium text-[#0038FF] hover:bg-[#0038FF]/20 transition-colors duration-150"
                >
                  {activeFilters.serviceName}
                  <X className="h-3 w-3" />
                </button>
              )}
              {activeFilters.groupName && (
                <button
                  onClick={() => setActiveFilters(prev => ({ ...prev, groupName: '' }))}
                  className="inline-flex items-center gap-1 rounded-full bg-[#0038FF]/10 px-2 py-0.5 text-[12px] font-medium text-[#0038FF] hover:bg-[#0038FF]/20 transition-colors duration-150"
                >
                  {activeFilters.groupName}
                  <X className="h-3 w-3" />
                </button>
              )}
              {/* Clear all */}
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors duration-150 ml-1"
              >
                Clear all
              </button>
            </>
          )}
        </div>

        {/* Vendors Grid or Table */}
        {viewMode === 'card' ? (
          <VendorsGrid
            vendors={finalVendors}
            isLoading={isLoading}
            emptyMessage={isSearchActive ? `No vendors found for "${searchInput}"` : "No vendors found"}
            basePath="/admin/vendors"
            perksCountMap={perksCountMap}
          />
        ) : (
          <VendorsTable
            vendors={finalVendors}
            isLoading={isLoading}
            emptyMessage={isSearchActive ? `No vendors found for "${searchInput}"` : "No vendors found"}
            basePath="/admin/vendors"
            perksCountMap={perksCountMap}
          />
        )}

        {/* Footer */}
        {!isLoading && vendors.length > 0 && !isSearchActive && (
          <div className="flex justify-center border-t border-gray-100 pt-6 mt-8">
            <p className="text-[13px] text-gray-400">
              Showing all {vendors.length} vendors
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Loading fallback
 */
function AdminVendorsPageLoading() {
  return (
    <div className="space-y-8">
      <div className="h-16 rounded-xl bg-amber-50/50 animate-pulse" />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-8 w-48 rounded-lg bg-gray-100 animate-pulse" />
        </div>
        <div className="h-5 w-64 rounded-lg bg-gray-100 animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-72 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function AdminVendorsPage() {
  return (
    <Suspense fallback={<AdminVendorsPageLoading />}>
      <AdminVendorsPageContent />
    </Suspense>
  );
}
