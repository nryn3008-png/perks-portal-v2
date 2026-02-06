'use client';

/**
 * Admin Access Requests Page — MercuryOS Design System
 *
 * ADMIN ONLY: View and manage manual access requests.
 * - List requests with status filter (All, Pending, Approved, Rejected)
 * - Approve or reject pending requests
 * - MercuryOS styling with Bridge Blue (#0038FF)
 */

import { Suspense, useEffect, useState, useCallback } from 'react';
import {
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  UserPlus,
  Clock,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import type { AccessRequest, AccessRequestStatus } from '@/types';
import { logger } from '@/lib/logger';

const PAGE_SIZE = 25;

type FilterStatus = AccessRequestStatus | 'all';

const STATUS_LABELS: Record<FilterStatus, string> = {
  all: 'All',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

const STATUS_COLORS: Record<AccessRequestStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
  approved: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function AccessRequestsContent() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{
    id: string;
    success: boolean;
    message: string;
  } | null>(null);

  const fetchRequests = useCallback(async (statusFilter: FilterStatus, pageNum: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: String(pageNum),
        page_size: String(PAGE_SIZE),
      });

      const res = await fetch(`/api/admin/access-requests?${params}`);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to fetch');
      }

      const data = await res.json();
      setRequests(data.data);
      setTotalCount(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      logger.error('Access requests fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch access requests');
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests(filterStatus, page);
  }, [fetchRequests, filterStatus, page]);

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    setActionLoading(requestId);
    setActionResult(null);

    try {
      const res = await fetch('/api/admin/access-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionResult({
          id: requestId,
          success: false,
          message: data.error?.message || 'Action failed',
        });
        return;
      }

      setActionResult({
        id: requestId,
        success: true,
        message: `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      });

      // Refresh list
      fetchRequests(filterStatus, page);
    } catch (err) {
      setActionResult({
        id: requestId,
        success: false,
        message: 'Network error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0038FF] to-[#0030E0]">
            <UserPlus className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Access Requests
          </h1>
        </div>
        <p className="text-[14px] text-gray-500 max-w-2xl">
          Review and manage manual access requests from users whose domains don&apos;t auto-match
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200">
        {(Object.keys(STATUS_LABELS) as FilterStatus[]).map((status) => {
          const isActive = filterStatus === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => {
                setFilterStatus(status);
                setPage(1);
              }}
              className={`relative flex items-center gap-1.5 pb-2.5 text-[13px] font-medium transition-colors duration-150 ${
                isActive
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {STATUS_LABELS[status]}
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

      {/* Action Result */}
      {actionResult && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 ${
            actionResult.success
              ? 'bg-emerald-50/80 border-emerald-200/60'
              : 'bg-red-50/80 border-red-200/60'
          }`}
        >
          {actionResult.success ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 shrink-0" />
          )}
          <p className={`text-[13px] ${actionResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
            {actionResult.message}
          </p>
          <button
            onClick={() => setActionResult(null)}
            className={`ml-auto text-[13px] font-medium ${
              actionResult.success ? 'text-emerald-600 hover:text-emerald-800' : 'text-red-600 hover:text-red-800'
            }`}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-gray-500" />
            <p className="text-[14px] text-gray-600">{error}</p>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && requests.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50/50 py-16 px-8">
          <UserPlus className="h-10 w-10 text-gray-300 mb-4" />
          <p className="text-[14px] text-gray-500">
            {filterStatus === 'all'
              ? 'No access requests yet.'
              : `No ${filterStatus} requests.`}
          </p>
        </div>
      )}

      {/* Requests Table */}
      {!isLoading && requests.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                <tr>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    User
                  </th>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Company
                  </th>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    VC / Investor
                  </th>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    VC Contact
                  </th>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-gray-900 truncate">
                          {req.user_name || 'Unknown'}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">{req.user_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[13px] text-gray-700">
                      {req.company_name}
                    </td>
                    <td className="px-4 py-4 text-[13px] text-gray-700">
                      {req.vc_name}
                    </td>
                    <td className="px-4 py-4">
                      {req.vc_contact_name || req.vc_contact_email ? (
                        <div className="min-w-0">
                          {req.vc_contact_name && (
                            <p className="text-[13px] text-gray-700 truncate">{req.vc_contact_name}</p>
                          )}
                          {req.vc_contact_email && (
                            <p className="text-[11px] text-gray-400 truncate">{req.vc_contact_email}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[13px]">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
                          STATUS_COLORS[req.status].bg
                        } ${STATUS_COLORS[req.status].text}`}
                      >
                        {req.status === 'pending' && <Clock className="h-3 w-3" />}
                        {req.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                        {req.status === 'rejected' && <XCircle className="h-3 w-3" />}
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[12px] text-gray-500 whitespace-nowrap">
                      {formatDate(req.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      {req.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAction(req.id, 'approve')}
                            disabled={actionLoading === req.id}
                            className="text-[12px]"
                          >
                            {actionLoading === req.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(req.id, 'reject')}
                            disabled={actionLoading === req.id}
                            className="text-[12px] text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[12px] text-gray-400">
                          {req.reviewed_by && `by ${req.reviewed_by}`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
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

function AccessRequestsLoading() {
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
      <div className="h-10 w-72 rounded-lg bg-gray-100 animate-pulse" />
      <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
    </div>
  );
}

export default function AccessRequestsPage() {
  return (
    <Suspense fallback={<AccessRequestsLoading />}>
      <AccessRequestsContent />
    </Suspense>
  );
}
