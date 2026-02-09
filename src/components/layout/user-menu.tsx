'use client';

/**
 * User Menu Dropdown — MercuryOS Design System
 * Clickable avatar that opens a popover with user info, connected accounts, and Bridge account link.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Mail, Loader2, Building2, Crown, Briefcase, Network, UserCheck, Settings, ChevronRight } from 'lucide-react';
import { logger } from '@/lib/logger';

const BRIDGE_ACCOUNT_URL = 'https://brdg.app/account/';
const BRIDGE_CONNECTED_ACCOUNTS_URL = 'https://brdg.app/connected-accounts/';

/**
 * Get favicon URL for a domain using Google's favicon service
 */
function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

/**
 * Get favicon URL for personal email providers
 */
function getPersonalEmailFaviconUrl(email: string): string {
  const domain = email.split('@')[1] || 'gmail.com';
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCESS STATUS DISPLAY
// ─────────────────────────────────────────────────────────────────────────────

const ACCESS_REASON_DISPLAY: Record<string, {
  label: string;
  description: (domain?: string) => string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; // Tailwind classes
}> = {
  admin: {
    label: 'Admin',
    description: (domain) =>
      domain ? `You have admin access through ${domain}` : 'You have admin access to the portal',
    icon: Crown,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  vc_team: {
    label: 'VC Team',
    description: (domain) =>
      domain ? `You have access as part of the ${domain} team` : 'You have access as a VC team member',
    icon: Briefcase,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  portfolio_match: {
    label: 'Portfolio Company',
    description: (domain) =>
      domain ? `Your company (${domain}) is in a partner VC's portfolio` : `Your company is in a partner VC's portfolio`,
    icon: Network,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  manual_grant: {
    label: 'Approved Access',
    description: () => 'Your access request was approved',
    icon: UserCheck,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface ConnectedAccount {
  email: string;
  domain: string;
  isPrimary: boolean;
  isPersonalEmail: boolean;
}

interface AccessInfo {
  granted: boolean;
  reason: string;
  matchedDomain?: string;
}

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [accessFetched, setAccessFetched] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch connected accounts when menu opens
  useEffect(() => {
    if (open && !fetched) {
      setLoading(true);
      fetch('/api/user/connected-accounts')
        .then((res) => res.json())
        .then((data) => {
          if (data.connectedAccounts) {
            setConnectedAccounts(data.connectedAccounts);
          }
          setFetched(true);
        })
        .catch((err) => {
          logger.error('Failed to fetch connected accounts:', err);
          setFetched(true);
        })
        .finally(() => setLoading(false));
    }
  }, [open, fetched]);

  // Fetch access status when menu opens
  useEffect(() => {
    if (open && !accessFetched) {
      fetch('/api/access/status')
        .then((res) => res.json())
        .then((data) => {
          if (data.granted) {
            setAccessInfo(data);
          }
          setAccessFetched(true);
        })
        .catch(() => {
          setAccessFetched(true);
        });
    }
  }, [open, accessFetched]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  // Separate work and personal accounts
  const workAccounts = connectedAccounts.filter((acc) => !acc.isPersonalEmail && acc.domain);
  const personalAccounts = connectedAccounts.filter((acc) => acc.isPersonalEmail);

  return (
    <div ref={menuRef} className="relative pl-3 border-l border-gray-200">
      {/* Trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg p-1 -m-1 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-7 w-7 rounded-full object-cover ring-1 ring-gray-200"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-xs font-medium text-white">
            {user.name?.charAt(0) || 'U'}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-white shadow-lg ring-1 ring-gray-200/60 border border-gray-100 animate-fade-in z-50 max-h-[80vh] overflow-y-auto">
          <div className="p-4">
            {/* Header */}
            <p className="text-xs font-medium text-gray-400 mb-3">Signed in as</p>

            {/* User info */}
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-200"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-sm font-medium text-white">
                  {user.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-[13px] text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Access Status Section */}
          {accessInfo?.granted && accessInfo.reason && ACCESS_REASON_DISPLAY[accessInfo.reason] && (
            <div className="border-t border-gray-100">
              <div className="px-4 py-3">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Access Status
                </p>
                {(() => {
                  const config = ACCESS_REASON_DISPLAY[accessInfo.reason];
                  const Icon = config.icon;
                  return (
                    <>
                      <div className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 border ${config.color}`}>
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-white/80">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-semibold">{config.label}</span>
                          <p className="text-[11px] opacity-80 mt-0.5">
                            {config.description(accessInfo.matchedDomain)}
                          </p>
                        </div>
                      </div>
                      {accessInfo.reason === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setOpen(false)}
                          className="mt-2 flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                          <Settings className="h-3 w-3" />
                          Admin Controls
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Connected Accounts Section */}
          <div className="border-t border-gray-100">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-400">Connected Accounts</p>
                <a
                  href={BRIDGE_CONNECTED_ACCOUNTS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Manage
                </a>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              ) : connectedAccounts.length > 0 ? (
                <div className="space-y-4">
                  {/* Work Accounts */}
                  {workAccounts.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Work
                      </p>
                      <div className="space-y-1.5">
                        {workAccounts.map((account) => (
                          <div
                            key={account.email}
                            className="flex items-center gap-2.5 rounded-lg bg-gray-50 px-3 py-2"
                          >
                            {/* Favicon */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getFaviconUrl(account.domain)}
                              alt={account.domain}
                              className="h-5 w-5 rounded-sm"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden h-5 w-5 items-center justify-center rounded-full bg-white ring-1 ring-gray-200">
                              <Building2 className="h-3 w-3 text-gray-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-medium text-gray-700 truncate">
                                {account.domain}
                              </p>
                              <p className="text-[10px] text-gray-400 truncate">{account.email}</p>
                            </div>
                            {account.isPrimary && (
                              <span className="text-[9px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                Primary
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Personal Accounts */}
                  {personalAccounts.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Personal
                      </p>
                      <div className="space-y-1.5">
                        {personalAccounts.map((account) => (
                          <div
                            key={account.email}
                            className="flex items-center gap-2.5 rounded-lg bg-gray-50 px-3 py-2"
                          >
                            {/* Favicon for personal email provider */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getPersonalEmailFaviconUrl(account.email)}
                              alt="Email"
                              className="h-5 w-5 rounded-sm"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden h-5 w-5 items-center justify-center rounded-full bg-white ring-1 ring-gray-200">
                              <Mail className="h-3 w-3 text-gray-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-medium text-gray-700 truncate">
                                {account.email}
                              </p>
                            </div>
                            {account.isPrimary && (
                              <span className="text-[9px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                Primary
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[13px] text-gray-400 py-2">
                  <Mail className="h-4 w-4" />
                  <span>No accounts connected</span>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Bridge account link */}
          <div className="p-2">
            <a
              href={BRIDGE_ACCOUNT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                window.open(BRIDGE_ACCOUNT_URL, '_blank', 'noopener,noreferrer');
              }}
            >
              {/* Bridge icon */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/bridge-icon.svg" alt="Bridge" className="h-5 w-5 rounded-full" />
              <span className="font-medium">Bridge account</span>
              <ExternalLink className="ml-auto h-3.5 w-3.5 text-gray-400" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
