'use client';

/**
 * Admin Whitelisted Domains Page - MercuryOS Design System
 *
 * ADMIN ONLY: Manages whitelisted domains via GetProven API
 * - List domains with pagination
 * - Upload CSV to add domains
 * - Mercury OS styling with Bridge Blue (#0038FF)
 */

import { Suspense, useEffect, useState, useCallback } from 'react';
import { AlertCircle, Loader2, Upload, Shield, CheckCircle, XCircle, Globe } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { AdminNav } from '@/components/admin/admin-nav';
import type { WhitelistDomain } from '@/types';

const PAGE_SIZE = 50;

interface ApiResponse {
  data: WhitelistDomain[];
  pagination: {
    count: number;
    next: string | null;
    previous: string | null;
  };
}

function WhitelistPageContent() {
  // Data state
  const [domains, setDomains] = useState<WhitelistDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    data?: unknown;
  } | null>(null);

  // Fetch domains
  const fetchDomains = useCallback(async (page = 1, loadMore = false) => {
    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setError(null);
    }

    try {
      const res = await fetch(
        `/api/admin/whitelist/domains?page=${page}&page_size=${PAGE_SIZE}`
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to fetch domains');
      }

      const data: ApiResponse = await res.json();

      if (loadMore) {
        setDomains((prev) => [...prev, ...data.data]);
      } else {
        setDomains(data.data);
        setTotalCount(data.pagination.count);
      }

      setCurrentPage(page);
      setHasMore(data.pagination.next !== null);
    } catch (err) {
      console.error('Whitelist fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unable to load whitelisted domains');
      if (!loadMore) setDomains([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDomains(1);
  }, [fetchDomains]);

  // Handle CSV upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/whitelist/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadResult({
          success: false,
          message: data.error?.message || 'Upload failed',
          data: data.error,
        });
      } else {
        setUploadResult({
          success: true,
          message: 'Upload successful',
          data: data,
        });
        // Refresh the domains list
        fetchDomains(1);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadResult({
        success: false,
        message: err instanceof Error ? err.message : 'Upload failed',
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

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
              <Globe className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              Whitelisted Domains
            </h1>
          </div>
          <p className="text-[14px] text-gray-500 max-w-2xl">
            Manage domains that are allowed to access perks
          </p>
        </div>

        {/* CSV Upload - Mercury OS style button */}
        <div>
          <label
            className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium px-4 py-2 text-[13px] transition-all duration-150 cursor-pointer ${
              isUploading
                ? 'bg-[#0038FF]/30 text-white cursor-not-allowed'
                : 'bg-gradient-to-br from-[#0038FF] to-[#0030E0] text-white hover:shadow-lg hover:shadow-[#0038FF]/25'
            }`}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="sr-only"
            />
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload CSV
              </>
            )}
          </label>
        </div>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className={`rounded-xl border p-4 ${uploadResult.success ? 'bg-emerald-50/80 border-emerald-200/60' : 'bg-red-50/80 border-red-200/60'}`}>
          <div className="flex items-start gap-4">
            {uploadResult.success ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-[14px] ${uploadResult.success ? 'text-emerald-900' : 'text-red-900'}`}>
                {uploadResult.message}
              </h3>
              {uploadResult.data !== undefined && uploadResult.data !== null && (
                <pre className={`mt-2 text-[12px] overflow-auto p-4 rounded-lg font-mono ${uploadResult.success ? 'bg-emerald-100/50 text-emerald-800' : 'bg-red-100/50 text-red-800'}`}>
                  {JSON.stringify(uploadResult.data, null, 2)}
                </pre>
              )}
            </div>
            <button
              onClick={() => setUploadResult(null)}
              className={`text-[13px] font-medium transition-colors ${uploadResult.success ? 'text-emerald-600 hover:text-emerald-800' : 'text-red-600 hover:text-red-800'}`}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-gray-500" aria-hidden="true" />
            <p className="text-[14px] text-gray-600">{error}</p>
          </div>
        </Card>
      )}

      {/* Results count */}
      <div className="flex items-center gap-2" aria-live="polite">
        <span className="text-[13px] text-gray-400">
          {isLoading
            ? 'Loading domains...'
            : `${totalCount} ${totalCount === 1 ? 'domain' : 'domains'} found`}
        </span>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && domains.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50/50 py-16 px-8">
          <Globe className="h-10 w-10 text-gray-300 mb-4" />
          <p className="text-[14px] text-gray-500">No whitelisted domains yet.</p>
        </div>
      )}

      {/* Domains Table */}
      {!isLoading && domains.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                <tr>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    ID
                  </th>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Domain
                  </th>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Offer Categories
                  </th>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Investment Level
                  </th>
                  <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                    Visible
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {domains.map((domain) => (
                  <tr key={domain.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 text-[13px] font-mono text-gray-500">
                      {domain.id}
                    </td>
                    <td className="px-4 py-4 text-[13px] font-medium text-gray-900">
                      {domain.domain}
                    </td>
                    <td className="px-4 py-4 text-[13px] text-gray-600">
                      {domain.offer_categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {domain.offer_categories.map((cat, index) => (
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
                      {domain.investment_level ? (
                        <span className="inline-flex rounded-full bg-[#0038FF]/10 px-2 py-0.5 text-[12px] font-medium text-[#0038FF]">
                          {domain.investment_level.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[13px]">
                      {domain.is_visible ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[12px] font-medium text-emerald-700">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[12px] font-medium text-red-700">
                          No
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

      {/* Load More Button */}
      {hasMore && !isLoading && (
        <div className="flex flex-col items-center gap-2 pt-4">
          <p className="text-[13px] text-gray-400">
            Showing {domains.length} of {totalCount} domains
          </p>
          <Button
            variant="outline"
            onClick={() => fetchDomains(currentPage + 1, true)}
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
      {!hasMore && !isLoading && domains.length > 0 && (
        <div className="flex justify-center border-t border-gray-100 pt-6">
          <p className="text-[13px] text-gray-400">
            Showing all {domains.length} domains
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Loading fallback
 */
function WhitelistPageLoading() {
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

export default function WhitelistPage() {
  return (
    <Suspense fallback={<WhitelistPageLoading />}>
      <WhitelistPageContent />
    </Suspense>
  );
}
