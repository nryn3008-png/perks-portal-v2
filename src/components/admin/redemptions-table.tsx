'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RedemptionRow {
  id: string;
  clicked_at: string;
  user_email: string;
  offer_name: string;
  vendor_name: string;
  estimated_value: number | null;
}

interface RedemptionsTableProps {
  data: RedemptionRow[];
  page: number;
  totalPages: number;
  totalRows: number;
  onPageChange: (page: number) => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCurrency(val: number | null) {
  if (val == null || val === 0) return '—';
  return `$${Number(val).toLocaleString()}`;
}

function truncate(text: string, max: number) {
  if (!text) return '—';
  return text.length > max ? text.slice(0, max) + '...' : text;
}

export function RedemptionsTable({ data, page, totalPages, totalRows, onPageChange }: RedemptionsTableProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">Recent Redemptions</h3>
        <p className="text-sm text-gray-500 mt-0.5">{totalRows} total redemption{totalRows !== 1 ? 's' : ''}</p>
      </div>

      {data.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-gray-400">No redemptions recorded yet. Data will appear here once users start redeeming perks.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Value</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{formatDate(row.clicked_at)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{truncate(row.user_email, 30)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{truncate(row.offer_name, 40)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.vendor_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(row.estimated_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="h-5 w-44 rounded bg-gray-200 mb-1" />
        <div className="h-4 w-28 rounded bg-gray-200" />
      </div>
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 w-28 rounded bg-gray-200" />
            <div className="h-4 w-36 rounded bg-gray-200" />
            <div className="h-4 w-44 rounded bg-gray-200" />
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-4 w-16 rounded bg-gray-200 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
