'use client';

/**
 * Admin Whitelisted Domains Page - MercuryOS Design System
 *
 * ADMIN ONLY: Manages whitelisted domains via GetProven API
 * - List domains with pagination
 * - Upload CSV via modal with drag-drop, format guidance, template download
 * - Human-friendly upload result display
 * - Mercury OS styling with Bridge Blue (#0038FF)
 */

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import {
  AlertCircle,
  Loader2,
  Upload,
  CheckCircle,
  XCircle,
  Globe,
  Download,
  Info,
  Code,
  X,
  FileText,
  UploadCloud,
} from 'lucide-react';
import { Button, Card, Disclosure } from '@/components/ui';
import type { WhitelistDomain } from '@/types';
import { logger } from '@/lib/logger';

const PAGE_SIZE = 50;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ApiResponse {
  data: WhitelistDomain[];
  pagination: {
    count: number;
    next: string | null;
    previous: string | null;
  };
}

/**
 * Parse the GetProven upload response into human-friendly summary lines.
 * Defensively handles unknown response shapes.
 */
function parseUploadSummary(data: unknown): string[] {
  const lines: string[] = [];

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    if ('created' in obj || 'added' in obj) {
      const created = obj.created ?? obj.added;
      lines.push(`${created} domain(s) added`);
    }
    if ('updated' in obj) {
      lines.push(`${obj.updated} domain(s) updated`);
    }
    if ('skipped' in obj || 'ignored' in obj) {
      const skipped = obj.skipped ?? obj.ignored;
      lines.push(`${skipped} domain(s) skipped`);
    }
    if ('errors' in obj && Array.isArray(obj.errors) && obj.errors.length > 0) {
      lines.push(`${obj.errors.length} error(s)`);
    }
    if ('total' in obj) {
      lines.push(`${obj.total} total rows processed`);
    }
    if ('message' in obj && typeof obj.message === 'string') {
      lines.push(obj.message);
    }
    if ('detail' in obj && typeof obj.detail === 'string') {
      lines.push(obj.detail);
    }
  }

  if (lines.length === 0) {
    lines.push('Upload processed successfully');
  }

  return lines;
}

/**
 * CSV column definitions for the format help section
 */
const CSV_COLUMNS = [
  {
    name: 'domain',
    required: true,
    description: 'Company domain to whitelist',
    example: 'a16z.com',
  },
  {
    name: 'offer_categories',
    required: false,
    description: 'Perk categories to assign',
    example: 'SaaS Tools',
  },
  {
    name: 'emails',
    required: false,
    description: 'Email addresses for this domain',
    example: 'partner@a16z.com',
  },
];

// ─── Upload Modal ────────────────────────────────────────────────────────────

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (result: { success: boolean; message: string; data?: unknown }) => void;
}

function UploadModal({ isOpen, onClose, onUploadComplete }: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setFileError(null);
      setIsUploading(false);
      setIsDragging(false);
      dragCounter.current = 0;
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUploading) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isUploading, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Validate file
  const validateFile = (file: File): string | null => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (ext !== '.csv') return 'Only CSV files are accepted';
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 5MB.`;
    }
    if (file.size === 0) return 'File is empty';
    return null;
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setFileError(null);
    const error = validateFile(file);
    if (error) {
      setFileError(error);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (dragCounter.current === 1) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/admin/whitelist/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        onUploadComplete({
          success: false,
          message: data.error?.message || 'Upload failed',
          data: data.error,
        });
      } else {
        onUploadComplete({
          success: true,
          message: 'Domains uploaded',
          data: data,
        });
      }
      onClose();
    } catch (err) {
      logger.error('Upload error:', err);
      onUploadComplete({
        success: false,
        message: err instanceof Error ? err.message : 'Upload failed',
      });
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    const headers = CSV_COLUMNS.map((c) => c.name);
    const exampleRow = CSV_COLUMNS.map((c) => c.example);
    const csv = [headers.join(','), exampleRow.join(',')].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'whitelist-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
        onClick={() => !isUploading && onClose()}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-xl shadow-[0px_6px_20px_rgba(0,0,0,0.1)] border border-gray-200/60 animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0038FF] to-[#0030E0]">
              <Upload className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2
                id="upload-modal-title"
                className="text-lg font-bold text-[#0D1531]"
              >
                Upload domains
              </h2>
              <p className="text-[13px] text-[#676C7E]">
                Add whitelisted domains via CSV
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#81879C] hover:text-[#0D1531] hover:bg-[#F2F3F5] transition-colors duration-150 disabled:opacity-30"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pt-5 pb-6 space-y-5">
          {/* Drop zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-all duration-150 ${
              isDragging
                ? 'border-[#0038FF] bg-[#0038FF]/5'
                : selectedFile
                  ? 'border-[#0EA02E]/40 bg-[#E7F6EA]/50'
                  : 'border-[#D9DBE1] bg-[#F9F9FA] hover:border-[#0038FF]/40 hover:bg-[#F2F5FF]'
            } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleInputChange}
              disabled={isUploading}
              className="sr-only"
            />

            {selectedFile ? (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#CFECD5]">
                  <FileText className="h-5 w-5 text-[#0EA02E]" />
                </div>
                <p className="mt-3 text-[14px] font-semibold text-[#0D1531]">
                  {selectedFile.name}
                </p>
                <p className="mt-1 text-[13px] text-[#676C7E]">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                  <span className="mx-1.5 text-[#D9DBE1]">&middot;</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setFileError(null);
                    }}
                    className="text-[#0038FF] hover:text-[#0036D7] font-medium"
                  >
                    Change file
                  </button>
                </p>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0038FF]/10">
                  <UploadCloud className="h-5 w-5 text-[#0038FF]" />
                </div>
                <p className="mt-3 text-[14px] font-medium text-[#0D1531]">
                  {isDragging ? 'Drop your CSV here' : 'Drag and drop a CSV file here'}
                </p>
                <p className="mt-1 text-[13px] text-[#81879C]">
                  or{' '}
                  <span className="text-[#0038FF] font-medium">
                    browse files
                  </span>
                </p>
              </>
            )}
          </div>

          {/* File validation error */}
          {fileError && (
            <div className="flex items-center gap-2 rounded-lg bg-[#FCEBEB] px-3 py-2.5">
              <XCircle className="h-4 w-4 text-[#E13535] flex-shrink-0" />
              <p className="text-[13px] text-[#9E0000]">{fileError}</p>
            </div>
          )}

          {/* CSV format help */}
          <div className="rounded-xl border border-[#ECEDF0] bg-[#F9F9FA] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-[#568FFF]" />
              <h3 className="text-[13px] font-bold text-[#0D1531]">CSV format</h3>
            </div>

            <div className="space-y-2">
              {CSV_COLUMNS.map((col) => (
                <div key={col.name} className="flex items-baseline gap-2">
                  <code className="text-[12px] font-mono font-semibold text-[#0D1531] bg-white px-1.5 py-0.5 rounded border border-[#E6E8ED] flex-shrink-0">
                    {col.name}
                  </code>
                  {col.required && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#E13535] flex-shrink-0">
                      Required
                    </span>
                  )}
                  <span className="text-[12px] text-[#676C7E]">
                    {col.description}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0038FF] hover:text-[#0036D7] transition-colors duration-150"
            >
              <Download className="h-3.5 w-3.5" />
              Download template CSV
            </button>

            <p className="mt-2 text-[12px] text-[#81879C]">
              Max 1,000 rows per file. For larger imports, contact support.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#ECEDF0] bg-[#F9F9FA]/50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="inline-flex items-center justify-center rounded-full font-semibold px-4 py-2 text-[14px] min-h-[38px] border border-[#B3B7C4] text-[#0D1531] hover:bg-[#F2F3F5] transition-all duration-150 disabled:opacity-30 tracking-[0.4px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold px-5 py-2 text-[14px] min-h-[38px] transition-all duration-150 tracking-[0.4px] ${
              !selectedFile || isUploading
                ? 'bg-[#0038FF]/30 text-white cursor-not-allowed'
                : 'bg-[#0038FF] text-white hover:bg-[#0036D7] shadow-sm'
            }`}
          >
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
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function WhitelistPageContent() {
  // Data state
  const [domains, setDomains] = useState<WhitelistDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
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
      logger.error('Whitelist fetch error:', err);
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

  // Handle upload complete
  const handleUploadComplete = (result: { success: boolean; message: string; data?: unknown }) => {
    setUploadResult(result);
    if (result.success) {
      fetchDomains(1);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
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
            Users from these domains and their portfolio companies automatically get access to the perks portal
          </p>
        </div>

        {/* Upload CSV button — opens modal */}
        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full font-semibold px-4 py-2 text-[14px] min-h-[38px] transition-all duration-150 border border-[#B3B7C4] bg-white text-[#0D1531] hover:bg-[#F2F3F5] hover:border-[#81879C] tracking-[0.4px]"
        >
          <Upload className="h-4 w-4" />
          Upload CSV
        </button>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />

      {/* Upload Result */}
      {uploadResult && (
        <div
          className={`rounded-xl border p-4 ${
            uploadResult.success
              ? 'bg-[#E7F6EA]/80 border-[#CFECD5]'
              : 'bg-[#FCEBEB]/80 border-[#F9D7D7]'
          }`}
        >
          <div className="flex items-start gap-4">
            {uploadResult.success ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#CFECD5]">
                <CheckCircle className="h-4 w-4 text-[#0EA02E]" />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F9D7D7]">
                <XCircle className="h-4 w-4 text-[#E13535]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3
                className={`font-semibold text-[14px] ${
                  uploadResult.success ? 'text-[#005F15]' : 'text-[#9E0000]'
                }`}
              >
                {uploadResult.message}
              </h3>
              {uploadResult.data !== undefined && uploadResult.data !== null && (
                <div className="mt-2 space-y-3">
                  {/* Human-readable summary */}
                  <ul
                    className={`text-[13px] space-y-1 ${
                      uploadResult.success ? 'text-[#005F15]' : 'text-[#9E0000]'
                    }`}
                  >
                    {parseUploadSummary(uploadResult.data).map((line, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                            uploadResult.success ? 'bg-[#0EA02E]' : 'bg-[#E13535]'
                          }`}
                        />
                        {line}
                      </li>
                    ))}
                  </ul>

                  {/* Collapsible raw response for debugging */}
                  <Disclosure trigger="Raw API response" icon={<Code className="h-4 w-4" />}>
                    <pre
                      className={`text-[12px] overflow-auto font-mono whitespace-pre-wrap ${
                        uploadResult.success ? 'text-[#005F15]' : 'text-[#9E0000]'
                      }`}
                    >
                      {JSON.stringify(uploadResult.data, null, 2)}
                    </pre>
                  </Disclosure>
                </div>
              )}
            </div>
            <button
              onClick={() => setUploadResult(null)}
              className={`text-[13px] font-medium transition-colors ${
                uploadResult.success
                  ? 'text-[#0EA02E] hover:text-[#005F15]'
                  : 'text-[#E13535] hover:text-[#9E0000]'
              }`}
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
            <p className="text-[14px] text-gray-600">No whitelisted domains yet.</p>
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
                        <span className="text-gray-400">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[13px] text-gray-600">
                      {domain.investment_level ? (
                        <span className="inline-flex rounded-full bg-[#0038FF]/10 px-2 py-0.5 text-[12px] font-medium text-[#0038FF]">
                          {domain.investment_level.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[13px]">
                      {domain.is_visible ? (
                        <span className="inline-flex rounded-full bg-[#E7F6EA] px-2 py-0.5 text-[12px] font-medium text-[#005F15]">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-[#FCEBEB] px-2 py-0.5 text-[12px] font-medium text-[#9E0000]">
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
