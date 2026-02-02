/**
 * Footer component - MercuryOS Design System
 * Unified footer: Bridge branding, tagline, and GetProven attribution.
 */

const GETPROVEN_URL = 'https://getproven.com';

export function Footer() {
  return (
    <footer className="w-full border-t border-gray-200/60 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Bridge logo + Perks Portal */}
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/bridge-logo.svg"
            alt="Bridge"
            className="h-4 w-auto"
          />
          <span className="text-[12px] text-gray-400">Perks Portal</span>
        </div>

        {/* Center: Tagline (hidden on mobile) */}
        <span className="hidden sm:block text-[12px] text-gray-400">
          Exclusive benefits for Bridge portfolio companies
        </span>

        {/* Right: Powered by GetProven */}
        <a
          href={GETPROVEN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
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
      </div>
    </footer>
  );
}
