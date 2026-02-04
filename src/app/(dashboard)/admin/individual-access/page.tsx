'use client';

/**
 * Admin Individual Access Page - MercuryOS Design System
 *
 * ADMIN ONLY: View individually whitelisted users via GetProven API
 * - List users with pagination
 * - Read-only UI (no edit/delete actions)
 * - Mercury OS styling with Bridge Blue (#0038FF)
 */

import { Suspense, useEffect, useState, useCallback } from 'react';
import { AlertCircle, Loader2, Shield, UserCheck, Users } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { AdminNav } from '@/components/admin/admin-nav';
import type { IndividualAccess } from '@/types';

const PAGE_SIZE = 50;

interface ApiResponse {
  data: IndividualAccess[];
  pagination: {
    count: number;
    next: string | null;
    previous: string | null;
  };
}

function IndividualAccessPageContent() {
  // Data state
  const [users, setUsers] = useState<IndividualAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async (page = 1, loadMore = false) => {
    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setError(null);
    }

    try {
      const res = await fetch(
        `/api/admin/whitelist/individual-access?page=${page}&page_size=${PAGE_SIZE}`
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to fetch users');
      }

      const data: ApiResponse = await res.json();

      if (loadMore) {
        setUsers((prev) => [...prev, ...data.data]);
      } else {
        setUsers(data.data);
        setTotalCount(data.pagination.count);
      }

      setCurrentPage(page);
      setHasMore(data.pagination.next !== null);
    } catch (err) {
      console.error('Individual access fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unable to load individual access list');
      if (!loadMore) setUsers([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Admin Navigation */}
      <AdminNav />

      {/* Admin Header - Mercury OS style */}
      <div className="flex items-center gap-4 rounded-xl bg-amber-50/80 border border-amber-200/60 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
          <Shield className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <h2 className="font-semibold text-amber-900 text-[14px]">Admin Only</h2>
          <p className="text-[13px] text-amber-700">
            This page is restricted to administrators
          </p>
        </div>
      </div>

      {/* Page Header - MercuryOS style */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0038FF] to-[#0030E0]">
              <Users className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              Individual Access
            </h1>
          </div>
          <p className="text-[14px] text-gray-500 max-w-2xl">
            Users with individual access to perks
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gray-100/80 px-2 py-2">
          <UserCheck className="h-4 w-4 text-gray-500" />
          <span className="text-[13px] text-gray-600 font-medium">Read-only view</span>
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
              onClick={() => fetchUsers(1)}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Results count */}
      <div className="flex items-center gap-2" aria-live="polite">
        <span className="text-[13px] text-gray-400">
          {isLoading
            ? 'Loading users...'
            : `${totalCount} ${totalCount === 1 ? 'user' : 'users'} found`}
        </span>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && users.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/80 py-16 px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0038FF]/10 to-[#0038FF]/5 mb-5">
            <UserCheck className="h-8 w-8 text-[#0038FF]/60" />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900 mb-2">
            No individual access granted
          </h3>
          <p className="text-[13px] text-gray-500 text-center max-w-sm mb-6">
            Individual access allows specific users to access perks without being on a whitelisted domain.
          </p>
          <div className="flex items-center gap-2 rounded-full bg-gray-100/80 px-3 py-1.5 text-[12px] text-gray-500">
            <Shield className="h-3.5 w-3.5" />
            <span>Manage access via GetProven dashboard</span>
          </div>
        </div>
      )}

      {/* Users Table */}
      {!isLoading && users.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                <tr>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    ID
                  </th>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Email
                  </th>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Offer Categories
                  </th>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Investment Level
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 text-[13px] font-mono text-gray-500">
                      {user.id}
                    </td>
                    <td className="px-4 py-4 text-[13px] font-medium text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-4 py-4 text-[13px] text-gray-600">
                      {user.offer_categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.offer_categories.map((cat, index) => (
                            <span
                              key={index}
                              className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[12px] font-medium text-gray-700"
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[13px] text-gray-600">
                      {user.investment_level ? (
                        <span className="inline-flex rounded-full bg-[#0038FF]/10 px-2 py-0.5 text-[12px] font-medium text-[#0038FF]">
                          {user.investment_level.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !isLoading && (
        <div className="flex flex-col items-center gap-2 pt-4">
          <p className="text-[13px] text-gray-400">
            Showing {users.length} of {totalCount} users
          </p>
          <Button
            variant="outline"
            onClick={() => fetchUsers(currentPage + 1, true)}
            disabled={isLoadingMore}
            className="rounded-lg"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}

      {/* Footer */}
      {!hasMore && !isLoading && users.length > 0 && (
        <div className="flex justify-center border-t border-gray-100 pt-6">
          <p className="text-[13px] text-gray-400">
            Showing all {users.length} users
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Loading fallback
 */
function IndividualAccessPageLoading() {
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
      <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
    </div>
  );
}

export default function IndividualAccessPage() {
  return (
    <Suspense fallback={<IndividualAccessPageLoading />}>
      <IndividualAccessPageContent />
    </Suspense>
  );
}
