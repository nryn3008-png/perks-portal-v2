'use client';

/**
 * Vendor Icon Component - MercuryOS Design System
 * Displays vendor logo with fallback chain: logo → favicon → initial
 * Used across perk cards and detail pages
 */

import { useState } from 'react';
import Image from 'next/image';

interface VendorIconProps {
  logo?: string;
  faviconUrl?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: { container: 'h-8 w-8', image: 20, initial: 'text-xs' },
  md: { container: 'h-12 w-12', image: 32, initial: 'text-lg' },
  lg: { container: 'h-16 w-16', image: 40, initial: 'text-2xl' },
};

export function VendorIcon({
  logo,
  faviconUrl,
  name,
  size = 'md',
  className = '',
}: VendorIconProps) {
  const [logoError, setLogoError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  const initial = name?.charAt(0)?.toUpperCase() || '?';
  const config = sizeConfig[size];

  const showLogo = logo && !logoError;
  const showFavicon = !showLogo && faviconUrl && !faviconError;
  const showInitial = !showLogo && !showFavicon;

  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-gray-100 ${config.container} ${className}`}
      aria-hidden="true"
    >
      {showLogo && (
        <Image
          src={logo}
          alt=""
          width={config.image}
          height={config.image}
          className="object-contain"
          style={{ width: config.image, height: config.image }}
          loading="lazy"
          unoptimized={logo.startsWith('/')}
          onError={() => setLogoError(true)}
        />
      )}
      {showFavicon && (
        <Image
          src={faviconUrl}
          alt=""
          width={config.image}
          height={config.image}
          className="object-contain"
          style={{ width: config.image, height: config.image }}
          loading="lazy"
          unoptimized
          onError={() => setFaviconError(true)}
        />
      )}
      {showInitial && (
        <span className={`font-semibold text-gray-400 ${config.initial}`}>
          {initial}
        </span>
      )}
    </div>
  );
}
