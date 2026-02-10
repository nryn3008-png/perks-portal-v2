/**
 * Top Navigation component - MercuryOS Design System
 * Minimal, clean header with logo
 */

import Link from 'next/link';
import { ApiHealthBadge } from './api-health-badge';
import { AccessBadge } from './access-badge';
import { UserMenu } from './user-menu';

// External brand URLs
const BRIDGE_URL = 'https://brdg.app/home/';
const GETPROVEN_URL = 'https://getproven.com';

interface TopNavProps {
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  /** Show API health badge — dev/internal only */
  showApiHealth?: boolean;
}

export function TopNav({ user, showApiHealth = false }: TopNavProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <div className="flex items-center gap-4">
          <a
            href={BRIDGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            aria-label="Bridge - Opens in new tab"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/bridge-logo.svg"
              alt="Bridge"
              className="h-5 w-auto"
            />
          </a>

          {/* Divider */}
          <div className="hidden sm:block h-5 w-px bg-gray-200" />

          {/* App title — links to perks page */}
          <Link
            href="/perks"
            className="hidden sm:block text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Perks Portal
          </Link>
        </div>

        {/* Right: Status & User */}
        <div className="flex items-center gap-4">
          {/* API Health Status — dev/internal only */}
          {showApiHealth && <ApiHealthBadge />}

          {/* Powered by GetProven */}
          <a
            href={GETPROVEN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Powered by GetProven - Opens in new tab"
          >
            <span className="font-normal">Powered by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/getproven-logo.png"
              alt="GetProven"
              className="h-2.5 w-auto"
            />
          </a>

          {/* Access Status Badge */}
          {user && <AccessBadge />}

          {/* User Menu (only shown when logged in) */}
          {user && <UserMenu user={user} />}
        </div>
      </div>
    </header>
  );
}
