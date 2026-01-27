'use client';

/**
 * Admin Whitelisted Domains Page
 *
 * ADMIN ONLY: Manages whitelisted domains via GetProven API
 * - List domains with pagination
 * - Upload CSV to add domains
 * - Display API responses verbatim
 */

import { Suspense, useEffect, useState, useCallback } from 'react';
import { AlertCircle, Loader2, Upload, Shield, CheckCircle, XCircle } from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
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
          <h1 className="text-2xl font-bold text-slate-900">Whitelisted Domains</h1>
          <p className="text-slate-600">
            Manage domains that are allowed to access perks
          </p>
        </div>

        {/* CSV Upload - styled to match Button component */}
        <div>
          <label
            className={`inline-flex items-center justify-center gap-2 rounded-full font-mulish font-semibold tracking-[0.4px] leading-6 px-4 py-2 text-sm transition-all duration-150 ${
              isUploading
                ? 'bg-[#0038ff]/30 text-white cursor-not-allowed'
                : 'bg-[#0038ff] text-white hover:bg-[#0030e0] cursor-pointer'
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
        <Card className={`p-4 ${uploadResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-4">
            {uploadResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium ${uploadResult.success ? 'text-green-900' : 'text-red-900'}`}>
                {uploadResult.message}
              </h3>
              {uploadResult.data !== undefined && uploadResult.data !== null && (
                <pre className={`mt-2 text-xs overflow-auto p-2 rounded ${uploadResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {JSON.stringify(uploadResult.data, null, 2)}
                </pre>
              )}
            </div>
            <button
              onClick={() => setUploadResult(null)}
              className={`text-sm ${uploadResult.success ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
            >
              Dismiss
            </button>
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
            onClick={() => fetchDomains(1)}
            className="ml-auto text-red-700 hover:bg-red-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-slate-500" aria-live="polite">
        {isLoading
          ? 'Loading domains...'
          : `${totalCount} ${totalCount === 1 ? 'domain' : 'domains'} found`}
      </p>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && domains.length === 0 && !error && (
        <Card className="p-8 text-center">
          <p className="text-slate-500">No whitelisted domains found</p>
        </Card>
      )}

      {/* Domains Table */}
      {!isLoading && domains.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-900">
                    ID
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-900">
                    Domain
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-900">
                    Offer Categories
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-900">
                    Investment Level
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-900">
                    Visible
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {domains.map((domain) => (
                  <tr key={domain.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">
                      {domain.id}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {domain.domain}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {domain.offer_categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {domain.offer_categories.map((cat, index) => (
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
                      {domain.investment_level ? (
                        <Badge variant="info">{domain.investment_level.name}</Badge>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {domain.is_visible ? (
                        <Badge variant="success">Yes</Badge>
                      ) : (
                        <Badge variant="error">No</Badge>
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
            Showing {domains.length} of {totalCount} domains
          </p>
          <Button
            variant="outline"
            onClick={() => fetchDomains(currentPage + 1, true)}
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
      {!hasMore && !isLoading && domains.length > 0 && (
        <div className="flex justify-center pt-4">
          <p className="text-sm text-slate-500">
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

export default function WhitelistPage() {
  return (
    <Suspense fallback={<WhitelistPageLoading />}>
      <WhitelistPageContent />
    </Suspense>
  );
}
