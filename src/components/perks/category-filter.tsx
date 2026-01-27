'use client';

/**
 * Category Filter component - MercuryOS Design System
 * Horizontal scrollable list of category filters
 * Accessible with proper focus states and touch targets
 */

import { cn } from '@/lib/utils';
import type { PerkCategory } from '@/types';

interface CategoryFilterProps {
  categories: PerkCategory[];
  selectedCategory?: string;
  onSelect: (categorySlug: string | undefined) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelect,
}: CategoryFilterProps) {
  return (
    <nav aria-label="Filter perks by category">
      <div
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        role="group"
        aria-label="Category filters"
      >
        {/* All categories button */}
        <button
          type="button"
          onClick={() => onSelect(undefined)}
          aria-pressed={!selectedCategory}
          className={cn(
            'flex-shrink-0 rounded-full px-4 text-sm font-medium transition-all duration-150',
            'min-h-[44px] min-w-[44px]', // WCAG touch target
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2',
            !selectedCategory
              ? 'bg-indigo-600 text-white active:bg-indigo-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
          )}
        >
          All Perks
        </button>

        {/* Category buttons */}
        {categories.map((category) => {
          const isSelected = selectedCategory === category.slug;
          const categoryName = category.name?.trim() || 'Uncategorized';

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.slug)}
              aria-pressed={isSelected}
              className={cn(
                'flex-shrink-0 rounded-full px-4 text-sm font-medium transition-all duration-150',
                'min-h-[44px] min-w-[44px]', // WCAG touch target
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2',
                isSelected
                  ? 'bg-indigo-600 text-white active:bg-indigo-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
              )}
            >
              {categoryName}
              {category.perkCount !== undefined && category.perkCount > 0 && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({category.perkCount})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
