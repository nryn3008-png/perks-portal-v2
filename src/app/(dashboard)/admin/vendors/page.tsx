'use client';

/**
 * Admin Vendors Page
 *
 * ADMIN ONLY: Manage vendors via GetProven API
 * - Fetches all vendors at once for complete search coverage
 * - Filter by search, service_name, group_name
 */

import { Suspense, useEffect, useState, useCallback } from 'react';
import { AlertCircle, Filter, X, Shield, LayoutGrid, List, Building2, Gift, Users, Calendar } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Card, SearchInput } from '@/components/ui';
import { VendorsGrid } from '@/components/vendors';
import type { GetProvenVendor } from '@/types';

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
 * Vendors Table Component
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
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Vendor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Primary Service</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Perks</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Employees</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Founded</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Services</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <tr key={i}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-slate-200 animate-pulse" />
                    <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
                  </div>
                </td>
                <td className="px-4 py-4"><div className="h-4 w-24 rounded bg-slate-200 animate-pulse" /></td>
                <td className="px-4 py-4"><div className="h-4 w-12 rounded bg-slate-200 animate-pulse" /></td>
                <td className="px-4 py-4"><div className="h-4 w-16 rounded bg-slate-200 animate-pulse" /></td>
                <td className="px-4 py-4"><div className="h-4 w-12 rounded bg-slate-200 animate-pulse" /></td>
                <td className="px-4 py-4"><div className="h-4 w-40 rounded bg-slate-200 animate-pulse" /></td>
              </tr>
            ))}
          </tbody>
        </table>
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

  // Table view
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Vendor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Primary Service</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Perks</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Employees</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Founded</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Services</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vendors.map((vendor) => {
              const employeeRange = formatEmployeeRange(vendor.employee_min, vendor.employee_max);
              const perksCount = perksCountMap?.[vendor.id];

              return (
                <tr
                  key={vendor.id}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-4">
                    <Link
                      href={`${basePath}/${vendor.id}`}
                      className="flex items-center gap-4 group"
                    >
                      {/* Logo */}
                      {vendor.logo ? (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
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
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-100">
                          <Building2 className="h-5 w-5 text-slate-400" aria-hidden="true" />
                        </div>
                      )}
                      <span className="font-medium text-slate-900 group-hover:text-brand-600">
                        {vendor.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {vendor.primary_service || <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-4">
                    {perksCount !== undefined ? (
                      <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                        <Gift className="h-3.5 w-3.5 text-slate-400" />
                        {perksCount}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {employeeRange ? (
                      <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {employeeRange}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {vendor.founded ? (
                      <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {vendor.founded}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {vendor.services.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {vendor.services.slice(0, 2).map((service, idx) => (
                          <span
                            key={idx}
                            className="inline-flex rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                          >
                            {service.name}
                          </span>
                        ))}
                        {vendor.services.length > 2 && (
                          <span className="text-xs text-slate-500">
                            +{vendor.services.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
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
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  // Fetch filter options from API
  const fetchFilterOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/vendors/filters');
      if (!res.ok) return;
      const data = await res.json();
      setFilterOptions(data);
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
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
      console.error('Failed to fetch perks count:', err);
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
      setVendors(data.data || []);
    } catch (err) {
      console.error('Vendors fetch error:', err);
      setError('Unable to load vendors. Please try again.');
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
        vendor.name.toLowerCase().includes(searchInput.toLowerCase())
      )
    : vendors;

  const hasFilterOptions =
    filterOptions.services.length > 0 ||
    filterOptions.vendorGroups.length > 0;

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex items-center gap-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
        <Shield className="h-5 w-5 text-amber-600" />
        <div>
          <h2 className="font-semibold text-amber-900">Admin Only</h2>
          <p className="text-sm text-amber-700">
            This page is restricted to administrators
          </p>
        </div>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vendors Management</h1>
        <p className="text-slate-600">
          View and manage vendor information
        </p>
      </div>

      {/* Search Bar with View Toggle and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Bar - filters as you type */}
        <SearchInput
          className="flex-1"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onClear={clearSearch}
          placeholder="Search vendors..."
          aria-label="Search vendors"
        />

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-full border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`flex items-center justify-center rounded-full px-3 py-1.5 transition-colors ${
                viewMode === 'card'
                  ? 'bg-[#0038ff] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              aria-label="Card view"
              aria-pressed={viewMode === 'card'}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center justify-center rounded-full px-3 py-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#0038ff] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              aria-label="Table view"
              aria-pressed={viewMode === 'table'}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Filter toggle button - uses secondary when active to avoid competing with Search primary button */}
          {hasFilterOptions && (
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 rounded-full bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700">
                  {(activeFilters.serviceName ? 1 : 0) + (activeFilters.groupName ? 1 : 0)}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && hasFilterOptions && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-900">Filter Vendors</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear all
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {/* Services Filter */}
            {filterOptions.services.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Service</p>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.services.slice(0, 15).map((service) => (
                    <button
                      key={service}
                      onClick={() =>
                        setActiveFilters((prev) => ({
                          ...prev,
                          serviceName: prev.serviceName === service ? '' : service,
                        }))
                      }
                      className={`rounded-full px-3 py-1 text-sm transition-colors ${
                        activeFilters.serviceName === service
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                  {filterOptions.services.length > 15 && (
                    <span className="px-3 py-1 text-sm text-slate-500">
                      +{filterOptions.services.length - 15} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Vendor Groups Filter */}
            {filterOptions.vendorGroups.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Group</p>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.vendorGroups.map((group) => (
                    <button
                      key={group}
                      onClick={() =>
                        setActiveFilters((prev) => ({
                          ...prev,
                          groupName: prev.groupName === group ? '' : group,
                        }))
                      }
                      className={`rounded-full px-3 py-1 text-sm transition-colors ${
                        activeFilters.groupName === group
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <div
          className="flex items-center gap-4 rounded-lg bg-red-50 p-4 text-red-800"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <p>{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchVendors()}
            className="ml-auto text-red-700 hover:bg-red-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Results */}
      <div>
        {/* Results count */}
        <p className="mb-4 text-sm text-slate-500" aria-live="polite">
          {isLoading
            ? 'Loading vendors...'
            : isSearchActive
            ? `${finalVendors.length} of ${vendors.length} ${vendors.length === 1 ? 'vendor' : 'vendors'} matching "${searchInput}"`
            : `${vendors.length} ${vendors.length === 1 ? 'vendor' : 'vendors'} found`}
        </p>

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

        {/* All loaded message */}
        {!isLoading && vendors.length > 0 && !isSearchActive && (
          <div className="flex justify-center border-t border-slate-200 pt-6 mt-6">
            <p className="text-sm text-slate-500">
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
    <div className="space-y-6">
      <div className="h-16 animate-pulse rounded-lg bg-amber-50" />
      <div>
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-5 w-64 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-72 animate-pulse rounded-xl bg-slate-100" />
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
