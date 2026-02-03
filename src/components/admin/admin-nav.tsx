'use client';

/**
 * Admin Navigation Tabs — MercuryOS Design System
 * Tab-style navigation for admin pages
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Globe,
  Users,
  Building2,
  BarChart3,
  Database,
} from 'lucide-react';

const adminLinks = [
  { href: '/admin/whitelist', label: 'Domains', icon: Globe },
  { href: '/admin/individual-access', label: 'Individual Access', icon: Users },
  { href: '/admin/vendors', label: 'Vendors', icon: Building2 },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/providers', label: 'Providers', icon: Database },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 border-b border-gray-200">
      <div className="flex items-center gap-0 -mb-px overflow-x-auto">
        {adminLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');

          return (
            <Link
              key={href}
              href={href}
              className={`
                inline-flex items-center gap-2 px-4 py-3
                text-[13px] font-medium whitespace-nowrap
                border-b-2 transition-all duration-200
                ${isActive
                  ? 'border-[#0038FF] text-[#0038FF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
