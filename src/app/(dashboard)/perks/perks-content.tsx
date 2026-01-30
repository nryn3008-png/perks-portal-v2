'use client';

/**
 * Perks (Offers) Listing Page - MercuryOS Design System
 *
 * Fluid, intent-driven interface with dark mode support
 * - Fetches ALL offers matching filters in one request (page_size=1000)
 * - Client-side search by vendor name or primary service area
 * - Smooth animations and glow effects on interactions
 */

import { Suspense, useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react';
import { AlertCircle, X, LayoutGrid, List, Gift, ChevronDown, Check, Filter, ArrowUpDown } from 'lucide-react';
import { Button, Card, SearchInput } from '@/components/ui';
import { OffersGrid } from '@/components/perks';
import type { GetProvenDeal } from '@/types';

/**
 * Filter Dropdown Component
 * Mercury OS-style dropdown with checkmarks for selected items
 */
function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
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

  const hasSelection = selected.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-1 rounded-lg px-2 py-2 text-[13px] font-medium
          border transition-all duration-150
          ${hasSelection
            ? 'border-[#0038FF]/20 bg-[#0038FF]/5 text-[#0038FF]'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
          }
        `}
      >
        <Filter className="h-3.5 w-3.5" />
        <span>{label}</span>
        {hasSelection && (
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0038FF] px-1 text-[10px] text-white">
            {selected.length}
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg animate-fade-in">
          {/* All option */}
          <button
            type="button"
            onClick={() => {
              onClear();
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
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => onToggle(option)}
                className={`
                  flex w-full items-center gap-2 px-2 py-2 text-left text-[13px]
                  transition-colors duration-100
                  ${isSelected ? 'text-gray-900' : 'text-gray-600 hover:bg-gray-50'}
                `}
              >
                {isSelected && <Check className="h-3.5 w-3.5 text-[#0038FF]" />}
                {!isSelected && <span className="w-3.5" />}
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Sort Dropdown Component
 * Mercury OS-style dropdown for sorting options
 */
type SortOption = 'default' | 'value-high' | 'value-low';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'value-high', label: 'Highest value' },
  { value: 'value-low', label: 'Lowest value' },
];

function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
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

  const currentLabel = SORT_OPTIONS.find((opt) => opt.value === value)?.label || 'Default';
  const isActive = value !== 'default';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-1 rounded-lg px-2 py-2 text-[13px] font-medium
          border transition-all duration-150
          ${isActive
            ? 'border-[#0038FF]/20 bg-[#0038FF]/5 text-[#0038FF]'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
          }
        `}
      >
        <ArrowUpDown className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{currentLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[140px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg animate-fade-in">
          {SORT_OPTIONS.map((option) => {
            const isSelected = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
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
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type ViewMode = 'grid' | 'grouped';

const PAGE_SIZE = 1000;

interface FilterOptions {
  offerCategories: string[];
  investmentLevels: string[];
}

interface ActiveFilters {
  offerCategories: string[];
  investmentLevels: string[];
}

const SCROLL_KEY = 'perks-scroll-position';

function PerksPageContent() {
  const [offers, setOffers] = useState<GetProvenDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendorMap, setVendorMap] = useState<Record<number, { logo: string | null; name: string; primaryService?: string | null }>>({});
  const [totals, setTotals] = useState<{ totalOffers: number; totalSavings: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    offerCategories: [],
    investmentLevels: [],
  });
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    offerCategories: [],
    investmentLevels: [],
  });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // Scroll restoration - save position before leaving, restore on mount
  useEffect(() => {
    // Restore scroll position on mount
    const savedPosition = sessionStorage.getItem(SCROLL_KEY);
    if (savedPosition && !isLoading) {
      window.scrollTo(0, parseInt(savedPosition, 10));
      sessionStorage.removeItem(SCROLL_KEY);
    }
  }, [isLoading]);

  // Save scroll position before navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    };

    // Save on any click (for client-side navigation)
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.href.includes('/perks/')) {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/perks/filters');
      if (!res.ok) return;
      const data = await res.json();
      setFilterOptions(data);
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
    }
  }, []);

  const fetchTotals = useCallback(async () => {
    try {
      const res = await fetch('/api/perks/totals');
      if (!res.ok) return;
      const data = await res.json();
      setTotals(data);
    } catch (err) {
      console.error('Failed to fetch totals:', err);
    }
  }, []);

  const fetchVendors = useCallback(async () => {
    try {
      const res = await fetch('/api/vendors?page_size=1000');
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<number, { logo: string | null; name: string; primaryService?: string | null }> = {};
      for (const vendor of data.data || []) {
        if (vendor.id) {
          map[vendor.id] = {
            logo: vendor.logo || null,
            name: vendor.name || '',
            primaryService: vendor.primary_service || null,
          };
        }
      }
      setVendorMap(map);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    }
  }, []);

  const fetchOffers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('page_size', String(PAGE_SIZE));

      if (activeFilters.offerCategories.length > 0) {
        params.set('offer_categories', activeFilters.offerCategories.join(','));
      }
      if (activeFilters.investmentLevels.length > 0) {
        params.set('investment_levels', activeFilters.investmentLevels.join(','));
      }

      const res = await fetch(`/api/perks?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch offers');

      const data = await res.json();
      setOffers(data.data || []);
    } catch (err) {
      console.error('Offers fetch error:', err);
      setError('Something went wrong loading perks. Hit retry or refresh the page.');
      setOffers([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => {
    fetchFilterOptions();
    fetchVendors();
    fetchTotals();
  }, [fetchFilterOptions, fetchVendors, fetchTotals]);

  useEffect(() => {
    fetchOffers();
  }, [activeFilters, fetchOffers]);

  const toggleFilter = (type: 'offerCategories' | 'investmentLevels', value: string) => {
    setActiveFilters((prev) => {
      const current = prev[type];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  const clearFilters = () => {
    setActiveFilters({
      offerCategories: [],
      investmentLevels: [],
    });
  };

  const hasActiveFilters =
    activeFilters.offerCategories.length > 0 ||
    activeFilters.investmentLevels.length > 0;

  const hasFilterOptions =
    filterOptions.offerCategories.length > 0 ||
    filterOptions.investmentLevels.length > 0;

  const isSearchActive = searchQuery.trim().length > 0;

  // Filter offers by search query
  const filteredOffers = isSearchActive
    ? offers.filter((offer) => {
        const vendor = vendorMap[offer.vendor_id];
        const vendorName = vendor?.name || '';
        const primaryService = vendor?.primaryService || '';
        const searchLower = searchQuery.toLowerCase();
        return (
          vendorName.toLowerCase().includes(searchLower) ||
          primaryService.toLowerCase().includes(searchLower)
        );
      })
    : offers;

  // Sort offers by value
  const finalOffers = sortBy === 'default'
    ? filteredOffers
    : [...filteredOffers].sort((a, b) => {
        const valueA = a.estimated_value || 0;
        const valueB = b.estimated_value || 0;
        return sortBy === 'value-high' ? valueB - valueA : valueA - valueB;
      });

  const getEmptyMessage = (): string => {
    if (isSearchActive) {
      return `No perks found for "${searchQuery}"`;
    }
    if (hasActiveFilters) {
      return 'No perks match your filters';
    }
    return 'No perks available yet — check back soon.';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header - MercuryOS style */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0038FF] to-[#0030E0]">
            <Gift className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Your Perks
          </h1>
        </div>
        <p className="text-[15px] text-gray-500 max-w-2xl">
          {totals ? (
            <>
              Access exclusive offers from trusted partners
              {totals.totalSavings && totals.totalSavings !== 'No data' && (
                <span className="text-[#0038FF] font-medium">
                  {' '}— worth over {totals.totalSavings} in savings
                </span>
              )}
            </>
          ) : (
            'Exclusive discounts from vetted vendors — browse and redeem in minutes.'
          )}
        </p>
      </div>

      {/* Search & Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          className="flex-1"
          placeholder="Search tools, vendors, or categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          aria-label="Search perks by vendor name or service area"
        />

        <div className="flex items-center gap-2">
          {/* Filter Dropdowns */}
          {filterOptions.investmentLevels.length > 0 && (
            <FilterDropdown
              label="Stage"
              options={filterOptions.investmentLevels}
              selected={activeFilters.investmentLevels}
              onToggle={(value) => toggleFilter('investmentLevels', value)}
              onClear={() => setActiveFilters(prev => ({ ...prev, investmentLevels: [] }))}
            />
          )}

          {filterOptions.offerCategories.length > 0 && (
            <FilterDropdown
              label="Category"
              options={filterOptions.offerCategories}
              selected={activeFilters.offerCategories}
              onToggle={(value) => toggleFilter('offerCategories', value)}
              onClear={() => setActiveFilters(prev => ({ ...prev, offerCategories: [] }))}
            />
          )}

          {/* Sort Dropdown */}
          <SortDropdown value={sortBy} onChange={setSortBy} />

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />

          {/* View mode toggle */}
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[13px] font-medium transition-all duration-150 ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[13px] font-medium transition-all duration-150 ${
                viewMode === 'grouped'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-pressed={viewMode === 'grouped'}
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">By vendor</span>
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
              onClick={() => fetchOffers()}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Results */}
      <div>
        {/* Results count with active filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2" aria-live="polite">
          <span className="text-[13px] text-gray-400">
            {isLoading
              ? 'Loading perks...'
              : isSearchActive
              ? `${finalOffers.length} ${finalOffers.length === 1 ? 'perk' : 'perks'} matching "${searchQuery}"`
              : viewMode === 'grouped'
              ? `${offers.length} ${offers.length === 1 ? 'perk' : 'perks'} from ${new Set(offers.map(o => o.vendor_id)).size} vendors`
              : `${offers.length} ${offers.length === 1 ? 'perk' : 'perks'} available`}
          </span>

          {/* Active filter and sort pills */}
          {(hasActiveFilters || sortBy !== 'default') && !isLoading && (
            <>
              <span className="text-[13px] text-gray-300">•</span>
              <span className="text-[12px] text-gray-400">
                {hasActiveFilters && sortBy !== 'default' ? 'Filtered & sorted:' : hasActiveFilters ? 'Filtered by:' : 'Sorted by:'}
              </span>
              {activeFilters.investmentLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => toggleFilter('investmentLevels', level)}
                  className="inline-flex items-center gap-1 rounded-full bg-[#0038FF]/10 px-2 py-0.5 text-[12px] font-medium text-[#0038FF] hover:bg-[#0038FF]/20 transition-colors duration-150"
                >
                  {level}
                  <X className="h-3 w-3" />
                </button>
              ))}
              {activeFilters.offerCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleFilter('offerCategories', category)}
                  className="inline-flex items-center gap-1 rounded-full bg-[#0038FF]/10 px-2 py-0.5 text-[12px] font-medium text-[#0038FF] hover:bg-[#0038FF]/20 transition-colors duration-150"
                >
                  {category}
                  <X className="h-3 w-3" />
                </button>
              ))}
              {sortBy !== 'default' && (
                <button
                  onClick={() => setSortBy('default')}
                  className="inline-flex items-center gap-1 rounded-full bg-[#0038FF]/10 px-2 py-0.5 text-[12px] font-medium text-[#0038FF] hover:bg-[#0038FF]/20 transition-colors duration-150"
                >
                  {SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label}
                  <X className="h-3 w-3" />
                </button>
              )}
              {/* Clear all */}
              <button
                type="button"
                onClick={() => {
                  clearFilters();
                  setSortBy('default');
                }}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors duration-150 ml-1"
              >
                Clear all
              </button>
            </>
          )}
        </div>

        {/* Offers Grid */}
        <OffersGrid
          key={`${searchQuery}-${viewMode}-${sortBy}-${finalOffers.length}`}
          offers={finalOffers}
          vendorMap={vendorMap}
          isLoading={isLoading}
          emptyMessage={getEmptyMessage()}
          groupByVendor={viewMode === 'grouped'}
        />

        {/* Footer */}
        {!isLoading && finalOffers.length > 0 && (
          <div className="flex justify-center border-t border-gray-100 pt-6 mt-8">
            <p className="text-[13px] text-gray-400">
              Showing all {finalOffers.length} perks
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PerksPageLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-8 w-40 rounded-lg bg-gray-100 animate-pulse" />
        </div>
        <div className="h-5 w-full max-w-96 rounded-lg bg-gray-100 animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function PerksPageClient() {
  return (
    <Suspense fallback={<PerksPageLoading />}>
      <PerksPageContent />
    </Suspense>
  );
}
