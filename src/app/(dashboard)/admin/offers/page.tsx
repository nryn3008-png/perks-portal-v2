'use client';

/**
 * Admin Offers Page — Bridge Design System
 *
 * ADMIN ONLY: View all perks/offers from GetProven in a table.
 * - Fetches all offers at once for complete search/filter coverage
 * - Shows vendor info, category, deal type, discount, value, investment level
 * - Tracks per-offer redemption counts from analytics
 * - Search + filter by category, deal type
 * - Bridge Blue (#0038FF) design tokens
 */

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import {
  AlertCircle,
  Gift,
  Building2,
  Tag,
  MousePointerClick,
  ChevronDown,
  Check,
  Filter,
  X,
  ExternalLink,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button, Card, SearchInput } from '@/components/ui';
import type { GetProvenDeal, GetProvenVendor } from '@/types';
import { logger } from '@/lib/logger';

// ─── Filter Dropdown ────────────────────────────────────────────────────────

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
          <button
            type="button"
            onClick={() => { onClear(); setIsOpen(false); }}
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

          {options.map((option) => {
            const isSelected = selected === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => { onSelect(option); setIsOpen(false); }}
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDiscount(discount: number | null, discountType: string | null): string | null {
  if (!discount) return null;
  if (discountType === 'percentage') return `${discount}%`;
  return `$${discount.toLocaleString()}`;
}

function formatValue(value: number | null): string | null {
  if (!value) return null;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface VendorInfo {
  name: string;
  logo: string | null;
  primaryService: string | null;
}

// ─── Page Content ────────────────────────────────────────────────────────────

function OffersPageContent() {
  // Data state
  const [offers, setOffers] = useState<GetProvenDeal[]>([]);
  const [vendorMap, setVendorMap] = useState<Record<number, VendorInfo>>({});
  const [redemptionCounts, setRedemptionCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dealTypeFilter, setDealTypeFilter] = useState('');

  // Derived filter options
  const [categories, setCategories] = useState<string[]>([]);
  const [dealTypes, setDealTypes] = useState<string[]>([]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch offers, vendors, and analytics in parallel
      const [offersRes, vendorsRes, analyticsRes] = await Promise.allSettled([
        fetch('/api/perks?page_size=1000'),
        fetch('/api/vendors?page_size=1000'),
        fetch('/api/admin/analytics?range=all'),
      ]);

      // Process offers
      if (offersRes.status === 'fulfilled' && offersRes.value.ok) {
        const data = await offersRes.value.json();
        const fetchedOffers: GetProvenDeal[] = data.data || [];
        setOffers(fetchedOffers);

        // Extract unique categories
        const cats = new Set<string>();
        const types = new Set<string>();
        for (const offer of fetchedOffers) {
          for (const cat of offer.offer_categories) {
            cats.add(cat.name);
          }
          if (offer.deal_type) {
            types.add(offer.deal_type);
          }
        }
        setCategories(Array.from(cats).sort());
        setDealTypes(Array.from(types).sort());
      } else {
        throw new Error('Failed to fetch offers');
      }

      // Process vendors
      if (vendorsRes.status === 'fulfilled' && vendorsRes.value.ok) {
        const data = await vendorsRes.value.json();
        const vendors: GetProvenVendor[] = data.data || [];
        const map: Record<number, VendorInfo> = {};
        for (const v of vendors) {
          map[v.id] = {
            name: v.name,
            logo: v.logo,
            primaryService: v.primary_service || v.services?.[0]?.name || null,
          };
        }
        setVendorMap(map);
      }

      // Process analytics — build per-offer redemption count
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
        const data = await analyticsRes.value.json();
        const clicks = data.table?.data || [];
        const counts: Record<string, number> = {};
        for (const click of clicks) {
          const key = String(click.offer_id || click.offer_name || '');
          if (key) {
            counts[key] = (counts[key] || 0) + 1;
          }
        }
        setRedemptionCounts(counts);
      }
    } catch (err) {
      logger.error('Offers fetch error:', err);
      setError('Something went wrong loading offers. Hit retry or refresh the page.');
      setOffers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side filtering
  const filteredOffers = offers.filter((offer) => {
    // Search filter
    if (searchInput.trim()) {
      const query = searchInput.toLowerCase();
      const vendor = vendorMap[offer.vendor_id];
      const matchesSearch =
        offer.name.toLowerCase().includes(query) ||
        (vendor?.name || '').toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (categoryFilter) {
      const hasCategory = offer.offer_categories.some((c) => c.name === categoryFilter);
      if (!hasCategory) return false;
    }

    // Deal type filter
    if (dealTypeFilter) {
      if (offer.deal_type !== dealTypeFilter) return false;
    }

    return true;
  });

  const hasActiveFilters = categoryFilter !== '' || dealTypeFilter !== '';
  const isSearchActive = searchInput.trim().length > 0;

  const clearFilters = () => {
    setSearchInput('');
    setCategoryFilter('');
    setDealTypeFilter('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0038FF] to-[#0030E0]">
            <Gift className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Offers
          </h1>
        </div>
        <p className="text-[14px] text-gray-500 max-w-2xl">
          All available perks and offers across vendors. Track redemptions and manage visibility.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          className="flex-1"
          placeholder="Search offers by name or vendor..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onClear={() => setSearchInput('')}
          aria-label="Search offers"
        />

        <div className="flex items-center gap-2">
          {categories.length > 0 && (
            <FilterDropdown
              label="Category"
              options={categories.slice(0, 20)}
              selected={categoryFilter}
              onSelect={(val) => setCategoryFilter(val)}
              onClear={() => setCategoryFilter('')}
            />
          )}

          {dealTypes.length > 0 && (
            <FilterDropdown
              label="Deal Type"
              options={dealTypes}
              selected={dealTypeFilter}
              onSelect={(val) => setDealTypeFilter(val)}
              onClear={() => setDealTypeFilter('')}
            />
          )}
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
              onClick={() => fetchData()}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Active filters status */}
      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        {(isSearchActive || hasActiveFilters) && !isLoading && (
          <>
            <span className="text-[13px] text-gray-400">
              {filteredOffers.length} of {offers.length} offers
              {isSearchActive && ` matching "${searchInput}"`}
            </span>

            {hasActiveFilters && (
              <>
                <span className="text-[13px] text-gray-300">•</span>
                <span className="text-[12px] text-gray-400">Filtered by:</span>
                {categoryFilter && (
                  <button
                    onClick={() => setCategoryFilter('')}
                    className="inline-flex items-center gap-1 rounded-full bg-[#0038FF]/10 px-2 py-0.5 text-[12px] font-medium text-[#0038FF] hover:bg-[#0038FF]/20 transition-colors duration-150"
                  >
                    {categoryFilter}
                    <X className="h-3 w-3" />
                  </button>
                )}
                {dealTypeFilter && (
                  <button
                    onClick={() => setDealTypeFilter('')}
                    className="inline-flex items-center gap-1 rounded-full bg-[#0038FF]/10 px-2 py-0.5 text-[12px] font-medium text-[#0038FF] hover:bg-[#0038FF]/20 transition-colors duration-150"
                  >
                    {dealTypeFilter}
                    <X className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors duration-150 ml-1"
                >
                  Clear all
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50/50">
              <tr>
                <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Vendor</th>
                <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Offer</th>
                <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Category</th>
                <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Discount</th>
                <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Value</th>
                <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">Redemptions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <tr key={i}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 animate-pulse" />
                      <div className="h-4 w-24 rounded bg-gray-100 animate-pulse" />
                    </div>
                  </td>
                  <td className="px-4 py-4"><div className="h-4 w-40 rounded bg-gray-100 animate-pulse" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-20 rounded bg-gray-100 animate-pulse" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-16 rounded bg-gray-100 animate-pulse" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-12 rounded bg-gray-100 animate-pulse" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-16 rounded bg-gray-100 animate-pulse" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-10 rounded bg-gray-100 animate-pulse" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredOffers.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/80 py-16 px-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 mb-4">
            <Gift className="h-7 w-7 text-gray-400" />
          </div>
          <p className="text-[14px] text-gray-600 font-medium mb-1">
            {isSearchActive || hasActiveFilters ? 'No matching offers' : 'No offers available'}
          </p>
          <p className="text-[13px] text-gray-400 text-center max-w-xs">
            {isSearchActive || hasActiveFilters
              ? 'Try adjusting your search or filters'
              : 'Offers will appear here once synced from GetProven'}
          </p>
        </div>
      )}

      {/* Offers Table */}
      {!isLoading && filteredOffers.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                <tr>
                  <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Vendor
                  </th>
                  <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Offer
                  </th>
                  <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Category
                  </th>
                  <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Type
                  </th>
                  <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Discount
                  </th>
                  <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Value
                  </th>
                  <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Redemptions
                  </th>
                  <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOffers.map((offer) => {
                  const vendor = vendorMap[offer.vendor_id];
                  const discount = formatDiscount(offer.discount, offer.discount_type);
                  const value = formatValue(offer.estimated_value);
                  const clicks = redemptionCounts[String(offer.id)] || redemptionCounts[offer.name] || 0;

                  return (
                    <tr
                      key={offer.id}
                      className="transition-colors hover:bg-gray-50/50"
                    >
                      {/* Vendor */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {vendor?.logo ? (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                              <Image
                                src={vendor.logo}
                                alt={`${vendor.name} logo`}
                                width={32}
                                height={32}
                                className="h-full w-full object-contain"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                              <Building2 className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <span className="text-[13px] font-medium text-gray-900 truncate max-w-[120px]">
                            {vendor?.name || 'Unknown'}
                          </span>
                        </div>
                      </td>

                      {/* Offer Name */}
                      <td className="px-4 py-4">
                        <Link
                          href={`/perks/${offer.id}`}
                          className="text-[13px] font-medium text-gray-900 hover:text-[#0038FF] transition-colors line-clamp-2 max-w-[280px]"
                        >
                          {offer.name}
                        </Link>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4">
                        {offer.offer_categories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {offer.offer_categories.slice(0, 2).map((cat, idx) => (
                              <span
                                key={idx}
                                className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600"
                              >
                                {cat.name}
                              </span>
                            ))}
                            {offer.offer_categories.length > 2 && (
                              <span className="text-[11px] text-gray-400">
                                +{offer.offer_categories.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Deal Type */}
                      <td className="px-4 py-4">
                        {offer.deal_type ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                            <Tag className="h-3 w-3" />
                            {offer.deal_type.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Discount */}
                      <td className="px-4 py-4">
                        {discount ? (
                          <span className="text-[13px] font-semibold text-[#0EA02E]">
                            {discount} off
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Estimated Value */}
                      <td className="px-4 py-4">
                        {value ? (
                          <span className="text-[13px] font-medium text-gray-900">
                            {value}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Redemptions */}
                      <td className="px-4 py-4">
                        {clicks > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[13px] text-gray-600">
                            <MousePointerClick className="h-3.5 w-3.5 text-gray-400" />
                            {clicks}
                          </span>
                        ) : (
                          <span className="text-[13px] text-gray-400">0</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <a
                          href={offer.getproven_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-medium text-gray-500 hover:text-[#0038FF] hover:bg-[#0038FF]/5 transition-colors"
                          title="View on GetProven"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      {!isLoading && filteredOffers.length > 0 && !isSearchActive && !hasActiveFilters && (
        <div className="flex justify-center border-t border-gray-100 pt-6 mt-8">
          <p className="text-[13px] text-gray-400">
            Showing all {offers.length} offers
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Loading Fallback ────────────────────────────────────────────────────────

function OffersPageLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gray-100 animate-pulse" />
          <div className="h-7 w-32 rounded-lg bg-gray-100 animate-pulse" />
        </div>
        <div className="h-5 w-64 rounded-lg bg-gray-100 animate-pulse" />
      </div>
      <div className="h-10 w-full rounded-full bg-gray-100 animate-pulse" />
      <div className="h-96 rounded-xl bg-gray-100 animate-pulse" />
    </div>
  );
}

export default function AdminOffersPage() {
  return (
    <Suspense fallback={<OffersPageLoading />}>
      <OffersPageContent />
    </Suspense>
  );
}
