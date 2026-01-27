'use client';

/**
 * Admin Individual Access Page
 *
 * ADMIN ONLY: View individually whitelisted users via GetProven API
 * - List users with pagination
 * - Read-only UI (no edit/delete actions)
 */

import { Suspense, useEffect, useState, useCallback } from 'react';
import { AlertCircle, Loader2, Shield, UserCheck } from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Individual Access</h1>
          <p className="text-slate-600">
            Users with individual access to perks
          </p>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <UserCheck className="h-5 w-5" />
          <span className="text-sm">Read-only view</span>
        </div>
      </div>

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
            onClick={() => fetchUsers(1)}
            className="ml-auto text-red-700 hover:bg-red-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-slate-500" aria-live="polite">
        {isLoading
          ? 'Loading users...'
          : `${totalCount} ${totalCount === 1 ? 'user' : 'users'} found`}
      </p>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && users.length === 0 && !error && (
        <Card className="p-8 text-center">
          <p className="text-slate-500">No individually whitelisted users</p>
        </Card>
      )}

      {/* Users Table */}
      {!isLoading && users.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-900">
                    ID
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-900">
                    Email
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-900">
                    Offer Categories
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-900">
                    Investment Level
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">
                      {user.id}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {user.offer_categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.offer_categories.map((cat, index) => (
                            <Badge key={index} variant="default">
                              {cat.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {user.investment_level ? (
                        <Badge variant="info">{user.investment_level.name}</Badge>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Load More Button */}
      {hasMore && !isLoading && (
        <div className="flex flex-col items-center gap-2 pt-4">
          <p className="text-sm text-slate-500">
            Showing {users.length} of {totalCount} users
          </p>
          <Button
            variant="outline"
            onClick={() => fetchUsers(currentPage + 1, true)}
            disabled={isLoadingMore}
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

      {/* All loaded message */}
      {!hasMore && !isLoading && users.length > 0 && (
        <div className="flex justify-center pt-4">
          <p className="text-sm text-slate-500">
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
    <div className="space-y-6">
      <div className="h-16 animate-pulse rounded-lg bg-amber-50" />
      <div>
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-5 w-64 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
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
