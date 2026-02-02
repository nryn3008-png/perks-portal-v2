'use client';

/**
 * Admin Analytics Dashboard — MercuryOS Design System
 *
 * Redemption click analytics: stats, charts, and recent activity.
 * Data sourced from Supabase `redemption_clicks` table.
 */

import { useEffect, useState, useCallback, Suspense } from 'react';
import { MousePointerClick, Users, DollarSign, TrendingUp, Shield, BarChart3 } from 'lucide-react';
import { StatCard, StatCardSkeleton } from '@/components/admin/stat-card';
import { DateRangeFilter, type DateRange } from '@/components/admin/date-range-filter';
import { ExportButton } from '@/components/admin/export-button';
import {
  RedemptionsOverTimeChart,
  TopPerksChart,
  TopVendorsChart,
  ValueOverTimeChart,
  ChartSkeleton,
} from '@/components/admin/redemption-chart';
import { RedemptionsTable, TableSkeleton } from '@/components/admin/redemptions-table';

interface AnalyticsData {
  stats: {
    totalClicks: number;
    uniqueUsers: number;
    totalValue: number;
    thisMonthClicks: number;
    lastMonthClicks: number;
    monthOverMonth: number;
  };
  charts: {
    timeSeries: { date: string; clicks: number; value: number }[];
    cumulativeValue: { date: string; value: number }[];
    topPerks: { name: string; count: number }[];
    topVendors: { name: string; count: number }[];
  };
  table: {
    data: Array<{
      id: string;
      clicked_at: string;
      user_email: string;
      offer_name: string;
      vendor_name: string;
      estimated_value: number | null;
    }>;
    page: number;
    totalPages: number;
    totalRows: number;
  };
  // Keep all rows for CSV export
  _allRows?: Array<{
    clicked_at: string;
    user_email: string;
    offer_name: string;
    vendor_name: string;
    estimated_value: number | null;
  }>;
}

function formatValue(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toLocaleString()}`;
}

function AnalyticsDashboard() {
  const [range, setRange] = useState<DateRange>('30d');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [allRows, setAllRows] = useState<AnalyticsData['_allRows']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (currentRange: DateRange, currentPage: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/analytics?range=${currentRange}&page=${currentPage}`);
      if (!res.ok) {
        if (res.status === 401) {
          setError('Unauthorized. Admin access required.');
          return;
        }
        throw new Error('Failed to fetch analytics');
      }
      const json = await res.json();
      setData(json);

      // On first page load, store all rows for export
      if (currentPage === 1) {
        // Fetch all for export (no pagination)
        const allRes = await fetch(`/api/admin/analytics?range=${currentRange}&page=1`);
        if (allRes.ok) {
          const allJson = await allRes.json();
          setAllRows(allJson.table.data);
        }
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Failed to load analytics data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchData(range, 1);
  }, [range, fetchData]);

  useEffect(() => {
    if (page > 1) {
      fetchData(range, page);
    }
  }, [page, range, fetchData]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Admin Header - Mercury OS style */}
      <div className="flex items-center gap-4 rounded-xl bg-amber-50/80 border border-amber-200/60 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
          <Shield className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <h2 className="font-semibold text-amber-900 text-[14px]">Admin Only</h2>
          <p className="text-[13px] text-amber-700">
            Internal view — not visible to regular users.
          </p>
        </div>
      </div>

      {/* Page Header - MercuryOS style */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0038FF] to-[#0030E0]">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Redemption Analytics
          </h1>
        </div>
        <p className="text-[14px] text-gray-500 max-w-2xl">
          Track perk redemption activity and value delivered.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <DateRangeFilter value={range} onChange={setRange} />
        <ExportButton data={allRows || []} disabled={isLoading} />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading || !data ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Total Redemptions"
              value={data.stats.totalClicks.toLocaleString()}
              icon={MousePointerClick}
            />
            <StatCard
              label="Unique Users"
              value={data.stats.uniqueUsers.toLocaleString()}
              icon={Users}
            />
            <StatCard
              label="Estimated Value"
              value={formatValue(data.stats.totalValue)}
              icon={DollarSign}
            />
            <StatCard
              label="This Month"
              value={data.stats.thisMonthClicks.toLocaleString()}
              icon={TrendingUp}
              trend={{
                value: data.stats.monthOverMonth,
                label: 'vs last month',
              }}
            />
          </>
        )}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading || !data ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <RedemptionsOverTimeChart data={data.charts.timeSeries} />
            <TopPerksChart data={data.charts.topPerks} />
          </>
        )}
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading || !data ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <TopVendorsChart data={data.charts.topVendors} />
            <ValueOverTimeChart data={data.charts.cumulativeValue} />
          </>
        )}
      </div>

      {/* Table */}
      {isLoading || !data ? (
        <TableSkeleton />
      ) : (
        <RedemptionsTable
          data={data.table.data}
          page={data.table.page}
          totalPages={data.table.totalPages}
          totalRows={data.table.totalRows}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-gray-400 text-sm">Loading analytics...</div>}>
      <AnalyticsDashboard />
    </Suspense>
  );
}
