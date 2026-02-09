'use client';

/**
 * Admin Sidebar Navigation — MercuryOS Design System
 *
 * Vertical sidebar for admin pages.
 * Order: Analytics → Vendors → Access Control (collapsible) → Providers.
 * Access Control children: Domains, Individual Access, Access Requests.
 * Count badges shown for Vendors and each Access Control child.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Globe,
  Users,
  UserPlus,
  Building2,
  BarChart3,
  Database,
  ChevronDown,
  ClipboardList,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Format a number as compact (e.g. 2400 → "2.4K") */
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

type CountKey = 'domains' | 'individual' | 'requests' | 'vendors';

const accessControlChildren: {
  href: string;
  label: string;
  icon: typeof Globe;
  countKey: CountKey;
}[] = [
  { href: '/admin/whitelist', label: 'Domains', icon: Globe, countKey: 'domains' },
  { href: '/admin/individual-access', label: 'Individual Access', icon: Users, countKey: 'individual' },
  { href: '/admin/access-requests', label: 'Access Requests', icon: UserPlus, countKey: 'requests' },
];

const ACCESS_CONTROL_PATHS = accessControlChildren.map((c) => c.href);

/** Links rendered BEFORE the Access Control group */
const topLinks: {
  href: string;
  label: string;
  icon: typeof Globe;
  countKey?: CountKey;
}[] = [
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/vendors', label: 'Vendors', icon: Building2, countKey: 'vendors' },
];

/** Links rendered AFTER the Access Control group */
const bottomLinks: {
  href: string;
  label: string;
  icon: typeof Globe;
  countKey?: CountKey;
}[] = [
  { href: '/admin/providers', label: 'Providers', icon: Database },
  { href: '/admin/changelog', label: 'Audit Logs', icon: ClipboardList },
];

// ─────────────────────────────────────────────────────────────────────────────
// COUNTS HOOK
// ─────────────────────────────────────────────────────────────────────────────

type Counts = Record<CountKey, number | null>;

function useSidebarCounts(): Counts {
  const [counts, setCounts] = useState<Counts>({
    domains: null,
    individual: null,
    requests: null,
    vendors: null,
  });

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [domainsRes, individualRes, requestsRes, vendorsRes] = await Promise.allSettled([
          fetch('/api/admin/whitelist/domains?page=1&page_size=1'),
          fetch('/api/admin/whitelist/individual-access?page=1&page_size=1'),
          fetch('/api/admin/access-requests?status=all&page=1&page_size=1'),
          fetch('/api/vendors?page=1&page_size=1'),
        ]);

        const next: Counts = { domains: null, individual: null, requests: null, vendors: null };

        if (domainsRes.status === 'fulfilled' && domainsRes.value.ok) {
          const data = await domainsRes.value.json();
          next.domains = data.pagination?.count ?? null;
        }

        if (individualRes.status === 'fulfilled' && individualRes.value.ok) {
          const data = await individualRes.value.json();
          next.individual = data.pagination?.count ?? null;
        }

        if (requestsRes.status === 'fulfilled' && requestsRes.value.ok) {
          const data = await requestsRes.value.json();
          next.requests = data.pagination?.total ?? null;
        }

        if (vendorsRes.status === 'fulfilled' && vendorsRes.value.ok) {
          const data = await vendorsRes.value.json();
          next.vendors = data.pagination?.count ?? null;
        }

        setCounts(next);
      } catch {
        // Silently fail — counts are decorative
      }
    }

    fetchCounts();
  }, []);

  return counts;
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

export function AdminSidebar() {
  const pathname = usePathname();
  const counts = useSidebarCounts();

  const isAccessControlActive = ACCESS_CONTROL_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  const [accessOpen, setAccessOpen] = useState(isAccessControlActive);

  return (
    <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50/50">
      <nav className="sticky top-14 flex flex-col gap-1 p-4 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
        {/* Section Label */}
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
          Admin
        </p>

        {/* 1. Analytics  2. Vendors */}
        {topLinks.map(({ href, label, icon: Icon, countKey }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          const count = countKey ? counts[countKey] : null;

          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-2.5 rounded-lg px-3 py-2
                text-[13px] font-medium transition-colors duration-150
                ${isActive
                  ? 'bg-[#0038FF]/[0.06] text-[#0038FF]'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {count !== null && (
                <span className={`text-[11px] tabular-nums ${
                  isActive ? 'text-[#0038FF]/60' : 'text-gray-400'
                }`}>
                  {formatCount(count)}
                </span>
              )}
            </Link>
          );
        })}

        {/* 3. Access Control — Collapsible Group */}
        <div>
          <button
            onClick={() => setAccessOpen((v) => !v)}
            className={`
              flex w-full items-center gap-2.5 rounded-lg px-3 py-2
              text-[13px] font-medium transition-colors duration-150
              ${isAccessControlActive
                ? 'text-[#0038FF]'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }
            `}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Access Control</span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${
                accessOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {accessOpen && (
            <div className="mt-0.5 flex flex-col gap-0.5">
              {accessControlChildren.map(({ href, label, icon: Icon, countKey }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/');
                const count = counts[countKey];

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`
                      flex items-center gap-2 rounded-lg py-2 pl-9 pr-3
                      text-[13px] font-medium transition-colors duration-150
                      ${isActive
                        ? 'bg-[#0038FF]/[0.06] text-[#0038FF]'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1">{label}</span>
                    {count !== null && (
                      <span className={`text-[11px] tabular-nums ${
                        isActive ? 'text-[#0038FF]/60' : 'text-gray-400'
                      }`}>
                        {formatCount(count)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Providers */}
        {bottomLinks.map(({ href, label, icon: Icon, countKey }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          const count = countKey ? counts[countKey] : null;

          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-2.5 rounded-lg px-3 py-2
                text-[13px] font-medium transition-colors duration-150
                ${isActive
                  ? 'bg-[#0038FF]/[0.06] text-[#0038FF]'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {count !== null && (
                <span className={`text-[11px] tabular-nums ${
                  isActive ? 'text-[#0038FF]/60' : 'text-gray-400'
                }`}>
                  {formatCount(count)}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
