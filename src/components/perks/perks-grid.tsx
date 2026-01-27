/**
 * Perks Grid component - MercuryOS Design System
 * Displays a grid of perk cards with loading and empty states
 * Accessible with proper ARIA attributes
 */

import { PerkCard } from './perk-card';
import type { PerkListItem } from '@/types';

interface PerksGridProps {
  perks: PerkListItem[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function PerksGrid({
  perks,
  isLoading = false,
  emptyMessage = 'No perks found',
}: PerksGridProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3"
        aria-busy="true"
        aria-label="Loading perks"
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl bg-gray-100"
            aria-hidden="true"
          />
        ))}
        <span className="sr-only">Loading perks, please wait...</span>
      </div>
    );
  }

  // Empty state
  if (perks.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-16"
        role="status"
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
          aria-hidden="true"
        >
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <p className="mt-4 text-[14px] text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul
      className="grid list-none gap-4 sm:gap-5 p-0 m-0 sm:grid-cols-2 lg:grid-cols-3"
      role="list"
      aria-label="Available perks"
    >
      {perks.map((perk) => (
        <li key={perk.id} className="list-none">
          <PerkCard perk={perk} />
        </li>
      ))}
    </ul>
  );
}
