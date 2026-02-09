'use client';

/**
 * Admin Audit Logs Page — MercuryOS Design System
 *
 * ADMIN ONLY: View audit log of all admin actions.
 * - Filterable by entity type and date range
 * - Color-coded action badges
 * - Paginated table view
 */

import { Suspense, useEffect, useState, useCallback } from 'react';
import {
  AlertCircle,
  Loader2,
  ClipboardList,
  CheckCircle,
  XCircle,
  Upload,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { DateRangeFilter } from '@/components/admin/date-range-filter';
import type { DateRange } from '@/components/admin/date-range-filter';
import type { ChangelogEntry, ChangelogEntityType } from '@/types';

const PAGE_SIZE = 25;

// ─────────────────────────────────────────────────────────────────────────────
// DISPLAY CONFIG
// ─────────────────────────────────────────────────────────────────────────────

type EntityFilter = ChangelogEntityType | 'all';

const ENTITY_FILTER_LABELS: Record<EntityFilter, string> = {
  all: 'All',
  access_request: 'Access Requests',
  whitelist: 'Whitelist',
  offers: 'Offers',
  vendors: 'Vendors',
  provider: 'Providers',
};

const ACTION_LABELS: Record<string, string> = {
  'access_request.approve': 'Approved',
  'access_request.reject': 'Rejected',
  'whitelist.upload_csv': 'CSV Upload',
  'offers.sync': 'Offer Sync',
  'vendors.sync': 'Vendor Sync',
  'provider.create': 'Created',
  'provider.update': 'Updated',
  'provider.delete': 'Deleted',
};

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  'access_request.approve': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'access_request.reject': { bg: 'bg-red-100', text: 'text-red-700' },
  'whitelist.upload_csv': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'offers.sync': { bg: 'bg-sky-100', text: 'text-sky-700' },
  'vendors.sync': { bg: 'bg-sky-100', text: 'text-sky-700' },
  'provider.create': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'provider.update': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'provider.delete': { bg: 'bg-red-100', text: 'text-red-700' },
};

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'access_request.approve': CheckCircle,
  'access_request.reject': XCircle,
  'whitelist.upload_csv': Upload,
  'offers.sync': RefreshCw,
  'vendors.sync': RefreshCw,
  'provider.create': Plus,
  'provider.update': Pencil,
  'provider.delete': Trash2,
};

const ENTITY_LABELS: Record<string, string> = {
  access_request: 'Access Request',
  whitelist: 'Whitelist',
  offers: 'Offers',
  vendors: 'Vendors',
  provider: 'Provider',
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function dateRangeToISO(range: DateRange): string | undefined {
  if (range === 'all') return undefined;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const from = new Date();
  from.setDate(from.getDate() - days);
  return from.toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CONTENT
// ─────────────────────────────────────────────────────────────────────────────

function ChangelogContent() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchChangelog = useCallback(
    async (entityFilterVal: EntityFilter, dateRangeVal: DateRange, pageNum: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          page_size: String(PAGE_SIZE),
        });

        if (entityFilterVal !== 'all') {
          params.set('entity_type', entityFilterVal);
        }

        const dateFrom = dateRangeToISO(dateRangeVal);
        if (dateFrom) {
          params.set('date_from', dateFrom);
        }

        const res = await fetch(`/api/admin/changelog?${params}`);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error?.message || 'Failed to fetch');
        }

        const data = await res.json();
        setEntries(data.data);
        setTotalCount(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchChangelog(entityFilter, dateRange, page);
  }, [fetchChangelog, entityFilter, dateRange, page]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0038FF] to-[#0030E0]">
            <ClipboardList className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Audit Logs
          </h1>
        </div>
        <p className="text-[14px] text-gray-500 max-w-2xl">
          Track all admin actions — access decisions, syncs, and configuration changes
        </p>
      </div>

      {/* Filters Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Entity Type Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 min-w-0 overflow-x-auto">
          {(Object.keys(ENTITY_FILTER_LABELS) as EntityFilter[]).map((entity) => {
            const isActive = entityFilter === entity;
            return (
              <button
                key={entity}
                type="button"
                onClick={() => {
                  setEntityFilter(entity);
                  setPage(1);
                }}
                className={`relative flex items-center gap-1.5 pb-2.5 text-[13px] font-medium transition-colors duration-150 whitespace-nowrap ${
                  isActive
                    ? 'text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {ENTITY_FILTER_LABELS[entity]}
                {isActive && totalCount > 0 && (
                  <span className="text-[12px] tabular-nums text-gray-400">
                    {totalCount}
                  </span>
                )}
                {/* Active underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-gray-900" />
                )}
              </button>
            );
          })}
        </div>

        {/* Date Range Filter */}
        <div className="shrink-0">
          <DateRangeFilter
            value={dateRange}
            onChange={(range) => {
              setDateRange(range);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-gray-500" />
          <p className="text-[14px] text-gray-600">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && entries.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50/50 py-16 px-8">
          <ClipboardList className="h-10 w-10 text-gray-300 mb-4" />
          <p className="text-[14px] text-gray-500">
            {entityFilter === 'all'
              ? 'No audit log entries yet. Admin actions will appear here.'
              : `No ${ENTITY_FILTER_LABELS[entityFilter].toLowerCase()} entries.`}
          </p>
        </div>
      )}

      {/* Changelog Table */}
      {!isLoading && entries.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                <tr>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Admin
                  </th>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Action
                  </th>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Entity
                  </th>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Summary
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => {
                  const actionColor = ACTION_COLORS[entry.action] || {
                    bg: 'bg-gray-100',
                    text: 'text-gray-700',
                  };
                  const ActionIcon = ACTION_ICONS[entry.action];

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Date */}
                      <td className="px-4 py-4 text-[12px] text-gray-500 whitespace-nowrap">
                        {formatDate(entry.created_at)}
                      </td>

                      {/* Admin */}
                      <td className="px-4 py-4">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-gray-900 truncate">
                            {entry.admin_name || 'Admin'}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {entry.admin_email}
                          </p>
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${actionColor.bg} ${actionColor.text}`}
                        >
                          {ActionIcon && <ActionIcon className="h-3 w-3" />}
                          {ACTION_LABELS[entry.action] || entry.action}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[12px] font-medium text-gray-600">
                          {ENTITY_LABELS[entry.entity_type] || entry.entity_type}
                        </span>
                      </td>

                      {/* Summary */}
                      <td className="px-4 py-4 text-[13px] text-gray-700 max-w-xs truncate">
                        {entry.summary}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !isLoading && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-[13px] text-gray-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function ChangelogLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-8 w-48 rounded-lg bg-gray-100 animate-pulse" />
        </div>
        <div className="h-5 w-80 rounded-lg bg-gray-100 animate-pulse" />
      </div>
      <div className="h-10 w-full rounded-lg bg-gray-100 animate-pulse" />
      <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function ChangelogPage() {
  return (
    <Suspense fallback={<ChangelogLoading />}>
      <ChangelogContent />
    </Suspense>
  );
}
