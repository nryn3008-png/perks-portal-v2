'use client';

/**
 * Access Restricted Page — MercuryOS Design System
 *
 * Shown to authenticated users whose connected email domains
 * don't match any whitelisted VC's portfolio.
 *
 * Features:
 * - Shows which domains were checked
 * - "Connect Another Account" link to Bridge
 * - Shows existing request status (pending/rejected) if one exists
 * - "Request Access" form only when no pending request
 * - "Refresh Check" button to re-verify
 *
 * Design: Bridge Blue #0038FF, Mulish, rounded elements
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldX,
  ExternalLink,
  Building2,
  RefreshCw,
  Send,
  AlertCircle,
  Link2,
  Loader2,
  Clock,
  XCircle,
} from 'lucide-react';
import { Button, LinkButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FEATURED_VCS } from '@/lib/constants/featured-vcs';

const BRIDGE_CONNECTED_ACCOUNTS_URL = 'https://brdg.app/connected-accounts/';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface AccessRestrictedProps {
  /** User's connected work domains that were checked */
  connectedDomains: string[];
  /** User's display name */
  userName: string;
  /** User's primary email */
  userEmail: string;
  /** Total whitelisted VC partner count (for "+N more" display) */
  totalPartnerCount?: number;
}

interface RequestFormData {
  company_name: string;
  vc_name: string;
  vc_contact_name: string;
  vc_contact_email: string;
}

interface ExistingRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  company_name: string;
  vc_name: string;
  created_at: string;
  reviewed_at?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN CHIP
// ─────────────────────────────────────────────────────────────────────────────

function DomainChip({ domain }: { domain: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt={domain}
        className="h-4 w-4 rounded-sm"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <Building2 className="hidden h-4 w-4 text-gray-400" />
      <span className="text-[13px] font-medium text-gray-700">{domain}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PENDING REQUEST STATUS
// ─────────────────────────────────────────────────────────────────────────────

function PendingRequestStatus({ request }: { request: ExistingRequest }) {
  return (
    <div className="rounded-xl border border-[#0038FF]/15 bg-[#0038FF]/[0.03] p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0038FF]/10">
          <Clock className="h-5 w-5 text-[#0038FF]" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-1">
            Access Request Under Review
          </h2>
          <p className="text-[13px] text-gray-500 mb-4">
            We received your request and will verify with your VC. You&apos;ll get access
            once it&apos;s approved.
          </p>
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-white/80 border border-[#0038FF]/10 p-4">
            <div>
              <p className="text-[11px] font-medium text-[#0038FF]/60 uppercase tracking-wider">Company</p>
              <p className="text-[13px] font-medium text-gray-900">{request.company_name}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#0038FF]/60 uppercase tracking-wider">VC / Investor</p>
              <p className="text-[13px] font-medium text-gray-900">{request.vc_name}</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3">
            Submitted on {formatDate(request.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REJECTED REQUEST STATUS
// ─────────────────────────────────────────────────────────────────────────────

function RejectedRequestStatus({ request }: { request: ExistingRequest }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200/60 bg-red-50/80 p-4 mb-5">
      <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-[13px] font-medium text-red-900">
          Your previous request was not approved
        </p>
        <p className="text-[12px] text-red-700 mt-0.5">
          Request for <span className="font-medium">{request.company_name}</span> via{' '}
          <span className="font-medium">{request.vc_name}</span> on {formatDate(request.created_at)}.
          You can submit a new request with different details below.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST ACCESS FORM
// ─────────────────────────────────────────────────────────────────────────────

function RequestAccessForm({
  onSubmitted,
}: {
  onSubmitted: (request: ExistingRequest) => void;
}) {
  const [formData, setFormData] = useState<RequestFormData>({
    company_name: '',
    vc_name: '',
    vc_contact_name: '',
    vc_contact_email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleChange = useCallback(
    (field: keyof RequestFormData) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        if (result) setResult(null);
      },
    [result]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company_name.trim() || !formData.vc_name.trim()) {
      setResult({ success: false, message: 'Company name and VC name are required.' });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch('/api/access-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: formData.company_name.trim(),
          vc_name: formData.vc_name.trim(),
          vc_contact_name: formData.vc_contact_name.trim(),
          vc_contact_email: formData.vc_contact_email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setResult({
            success: false,
            message: 'You already have a pending access request. We\'ll review it soon.',
          });
        } else {
          setResult({
            success: false,
            message: data.error?.message || 'Failed to submit request. Please try again.',
          });
        }
        return;
      }

      // Notify parent to show pending status instead of form
      onSubmitted({
        id: data.request.id,
        status: 'pending',
        company_name: formData.company_name.trim(),
        vc_name: formData.vc_name.trim(),
        created_at: data.request.created_at || new Date().toISOString(),
      });
    } catch {
      setResult({
        success: false,
        message: 'Network error. Please check your connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Required Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="company_name" className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
            Company Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="company_name"
            placeholder="e.g., Acme Startup"
            value={formData.company_name}
            onChange={handleChange('company_name')}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="vc_name" className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
            VC / Investor Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="vc_name"
            placeholder="e.g., Techstars"
            value={formData.vc_name}
            onChange={handleChange('vc_name')}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Optional Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="vc_contact_name" className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
            VC Contact Person
          </label>
          <Input
            id="vc_contact_name"
            placeholder="e.g., Jane Smith"
            value={formData.vc_contact_name}
            onChange={handleChange('vc_contact_name')}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="vc_contact_email" className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
            VC Contact Email
          </label>
          <Input
            id="vc_contact_email"
            type="email"
            placeholder="e.g., jane@techstars.com"
            value={formData.vc_contact_email}
            onChange={handleChange('vc_contact_email')}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-2">
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting || !formData.company_name.trim() || !formData.vc_name.trim()}
        >
          <Send className="h-4 w-4" />
          Submit Request
        </Button>
      </div>

      {/* Error Message */}
      {result && !result.success && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200/60 bg-red-50/80 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-[13px] text-red-800">{result.message}</p>
        </div>
      )}
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAL EMAIL NOTICE
// ─────────────────────────────────────────────────────────────────────────────

function PersonalEmailNotice() {
  return (
    <div className="rounded-xl border border-amber-200/60 bg-amber-50/80 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <AlertCircle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-semibold text-amber-900 mb-1">
            Personal Email Detected
          </h2>
          <p className="text-[13px] text-amber-800 leading-relaxed">
            You&apos;re currently signed in with a personal email address. To access
            the perks portal, please connect your <span className="font-semibold">work email</span> to
            your Bridge account so we can verify your company.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST ACCESS SECTION (handles fetch + state switching)
// ─────────────────────────────────────────────────────────────────────────────

function RequestAccessSection() {
  const [existingRequest, setExistingRequest] = useState<ExistingRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchExistingRequest() {
      try {
        const res = await fetch('/api/access-request');
        if (res.ok) {
          const data = await res.json();
          setExistingRequest(data.request || null);
        }
      } catch {
        // Ignore — show form as fallback
      } finally {
        setIsLoading(false);
      }
    }
    fetchExistingRequest();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
        </div>
      </div>
    );
  }

  // Pending request — show status, hide form
  if (existingRequest?.status === 'pending') {
    return <PendingRequestStatus request={existingRequest} />;
  }

  // Rejected or no request — show form (with rejection notice if applicable)
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      {/* Rejection notice */}
      {existingRequest?.status === 'rejected' && (
        <RejectedRequestStatus request={existingRequest} />
      )}

      <div className="mb-5">
        <h2 className="text-[15px] font-semibold text-gray-900 mb-1">
          Request Access
        </h2>
        <p className="text-[13px] text-gray-500">
          If your company is part of a VC&apos;s portfolio but wasn&apos;t automatically
          detected, submit a request below. We&apos;ll verify with your VC and
          grant access.
        </p>
      </div>

      <RequestAccessForm
        onSubmitted={(req) => setExistingRequest(req)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTNER NETWORK — SOCIAL PROOF
// ─────────────────────────────────────────────────────────────────────────────

function VCLogoCard({ domain, name }: { domain: string; name: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 transition-all duration-150 hover:border-gray-200 hover:shadow-sm">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
          alt={name}
          className="h-8 w-8 rounded object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <Building2 className="hidden h-5 w-5 text-gray-300" />
      </div>
      <span className="text-[12px] font-medium text-gray-600 text-center leading-tight line-clamp-2">
        {name}
      </span>
    </div>
  );
}

function PartnerNetworkSection({ totalCount }: { totalCount?: number }) {
  const featuredCount = FEATURED_VCS.length;
  const remainingCount = totalCount
    ? Math.max(0, totalCount - featuredCount)
    : null;

  return (
    <>
      {/* Divider */}
      <div className="border-t border-gray-200" />

      <div className="text-center mb-6">
        <p className="text-[11px] font-semibold text-[#0038FF]/60 uppercase tracking-wider mb-1">
          Our Partner Network
        </p>
        <h2 className="text-[15px] font-semibold text-gray-900">
          Trusted by leading venture capital firms
        </h2>
        <p className="text-[13px] text-gray-500 mt-1">
          Your company must be in a partner VC&apos;s portfolio to access perks
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {FEATURED_VCS.map((vc) => (
          <VCLogoCard key={vc.domain} domain={vc.domain} name={vc.name} />
        ))}
      </div>

      {remainingCount != null && remainingCount > 0 && (
        <p className="text-center text-[13px] text-gray-400 font-medium mt-4">
          + {remainingCount} more partner firms
        </p>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function AccessRestrictedPage({
  connectedDomains,
  userName,
  userEmail,
  totalPartnerCount,
}: AccessRestrictedProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshCheck = useCallback(async () => {
    setIsRefreshing(true);

    try {
      await fetch('/api/access-request/refresh', { method: 'POST' });
    } catch {
      // Ignore — we'll reload anyway
    }

    window.location.reload();
  }, []);

  const hasWorkEmail = connectedDomains.length > 0;

  // ── Personal email only: simplified page ──────────────────────────────
  if (!hasWorkEmail) {
    return (
      <div className="flex flex-col items-center pt-12 sm:pt-20 pb-16 px-4 animate-fade-in">
        <div className="w-full max-w-2xl text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-6">
            <ShieldX className="h-8 w-8 text-gray-400" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-3">
            Access Restricted
          </h1>
          <p className="text-[15px] text-gray-500 max-w-lg mx-auto leading-relaxed">
            {userName ? `Hi ${userName}, you` : 'You'}&apos;re signed in with a personal
            email (<span className="font-medium text-gray-700">{userEmail}</span>).
            Connect your work email to access the perks portal.
          </p>
        </div>

        <div className="w-full max-w-2xl space-y-6">
          <PersonalEmailNotice />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <LinkButton
              href={BRIDGE_CONNECTED_ACCOUNTS_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="lg"
              className="flex-1 justify-center"
            >
              <Link2 className="h-4 w-4" />
              Connect Work Email
              <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-60" />
            </LinkButton>

            <Button
              variant="outline"
              size="lg"
              onClick={handleRefreshCheck}
              disabled={isRefreshing}
              className="flex-1 justify-center"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isRefreshing ? 'Checking...' : 'Refresh Access Check'}
            </Button>
          </div>

          {/* Partner Network — Social Proof */}
          <PartnerNetworkSection totalCount={totalPartnerCount} />
        </div>
      </div>
    );
  }

  // ── Work email present: full page with domains + request form ─────────
  return (
    <div className="flex flex-col items-center pt-12 sm:pt-20 pb-16 px-4 animate-fade-in">
      {/* Hero Section */}
      <div className="w-full max-w-2xl text-center mb-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-6">
          <ShieldX className="h-8 w-8 text-gray-400" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-3">
          Access Restricted
        </h1>
        <p className="text-[15px] text-gray-500 max-w-lg mx-auto leading-relaxed">
          {userName ? `Hi ${userName}, your` : 'Your'} connected email domains don&apos;t match any
          partner VC&apos;s portfolio. You can connect another account, or request
          access below.
        </p>
      </div>

      {/* Content Cards */}
      <div className="w-full max-w-2xl space-y-6">
        {/* Checked Domains */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-gray-400" />
            <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
              Domains We Checked
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {connectedDomains.map((domain) => (
              <DomainChip key={domain} domain={domain} />
            ))}
          </div>

          <p className="text-[12px] text-gray-400 mt-3">
            Signed in as {userEmail}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <LinkButton
            href={BRIDGE_CONNECTED_ACCOUNTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            size="lg"
            className="flex-1 justify-center"
          >
            <Link2 className="h-4 w-4" />
            Connect Another Account
            <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-60" />
          </LinkButton>

          <Button
            variant="outline"
            size="lg"
            onClick={handleRefreshCheck}
            disabled={isRefreshing}
            className="flex-1 justify-center"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isRefreshing ? 'Checking...' : 'Refresh Access Check'}
          </Button>
        </div>

        {/* Request Access Section (auto-fetches existing request) */}
        <RequestAccessSection />

        {/* Partner Network — Social Proof */}
        <PartnerNetworkSection totalCount={totalPartnerCount} />
      </div>
    </div>
  );
}
