'use client';

/**
 * Preview: Access Restricted — Rejected Request
 *
 * Shows the access-restricted page as seen by a user whose previous
 * access request was rejected. They see the rejection notice above
 * the request form so they can submit again with different details.
 *
 * URL: /preview/access-request-rejected
 */

import { useState } from 'react';
import {
  ShieldX,
  ExternalLink,
  Building2,
  RefreshCw,
  Send,
  Link2,
  Loader2,
  XCircle,
} from 'lucide-react';
import { Button, LinkButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FEATURED_VCS } from '@/lib/constants/featured-vcs';

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
        }}
      />
      <span className="text-[13px] font-medium text-gray-700">{domain}</span>
    </div>
  );
}

export default function AccessRequestRejectedPreview() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshCheck = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

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
          Hi Demo User, your connected email domains don&apos;t match any
          partner VC&apos;s portfolio. You can connect another account, or request
          access below.
        </p>
      </div>

      {/* Content Cards */}
      <div className="w-full max-w-2xl space-y-6">
        {/* Checked Domains */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-gray-400" />
            <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
              Work Emails Checked
            </h2>
          </div>
          <p className="text-[12px] text-gray-400 mb-4">
            We checked all work email domains connected to your account against our partner network
          </p>

          <div className="flex flex-wrap gap-2">
            <DomainChip domain="acmestartup.com" />
            <DomainChip domain="foundermail.io" />
          </div>

          <p className="text-[12px] text-gray-400 mt-3">
            Signed in as demo@acmestartup.com
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <LinkButton
            href="#"
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

        {/* Rejected Request + Form */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          {/* Rejection Notice */}
          <div className="flex items-start gap-3 rounded-xl border border-red-200/60 bg-red-50/80 p-4 mb-5">
            <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-red-900">
                Your previous request was not approved
              </p>
              <p className="text-[12px] text-red-700 mt-0.5">
                Request for <span className="font-medium">Acme Startup Inc.</span> via{' '}
                <span className="font-medium">Techstars</span> on Jan 15, 2025.
                You can submit a new request with different details below.
              </p>
            </div>
          </div>

          {/* Request Form */}
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

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <Input placeholder="e.g., Acme Startup" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
                  VC / Investor Name <span className="text-red-500">*</span>
                </label>
                <Input placeholder="e.g., Techstars" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
                  VC Contact Person
                </label>
                <Input placeholder="e.g., Jane Smith" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
                  VC Contact Email
                </label>
                <Input type="email" placeholder="e.g., jane@techstars.com" />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Button type="button" variant="primary">
                <Send className="h-4 w-4" />
                Submit Request
              </Button>
            </div>
          </form>
        </div>

        {/* Partner Network */}
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
          {FEATURED_VCS.slice(0, 8).map((vc) => (
            <div key={vc.domain} className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 transition-all duration-150 hover:border-gray-200 hover:shadow-sm">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${vc.domain}&sz=64`}
                  alt={vc.name}
                  className="h-8 w-8 rounded object-contain"
                />
              </div>
              <span className="text-[12px] font-medium text-gray-600 text-center leading-tight line-clamp-2">
                {vc.name}
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-[13px] text-gray-400 font-medium mt-4">
          + 34 more partner firms
        </p>
      </div>
    </div>
  );
}
