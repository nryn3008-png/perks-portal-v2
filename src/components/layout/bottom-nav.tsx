'use client';

/**
 * Bottom Navigation component - MercuryOS Design System
 * Mobile-only navigation bar fixed to bottom of screen
 *
 * Features:
 * - Fixed to bottom on mobile (hidden on md and above)
 * - Icon + label for each nav item
 * - Active state indication
 * - Touch-friendly 44px+ hit areas
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Gift,
  Building2,
  Shield,
  UserCheck,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAVIGATION } from '@/lib/constants';
import { useState } from 'react';

// Map icon names to components
const iconMap: Record<string, React.ElementType> = {
  Gift,
  Building2,
  Shield,
  UserCheck,
};

interface BottomNavProps {
  isAdmin?: boolean;
}

export function BottomNav({ isAdmin = false }: BottomNavProps) {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Combine main and admin nav items
  const mainItems = NAVIGATION.main;
  const adminItems = isAdmin ? NAVIGATION.admin : [];

  // Show up to 4 items in bottom nav, rest in "More" menu
  const visibleItems = [...mainItems, ...adminItems].slice(0, 4);
  const moreItems = [...mainItems, ...adminItems].slice(4);
  const hasMoreItems = moreItems.length > 0;

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More menu popup */}
      {showMore && hasMoreItems && (
        <div className="fixed bottom-20 left-4 right-4 z-50 rounded-xl bg-white shadow-lg border border-gray-200 p-2 md:hidden">
          {moreItems.map((item) => {
            const Icon = iconMap[item.icon];
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMore(false)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-4 text-sm font-medium transition-colors duration-150',
                  'min-h-[48px]',
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                {Icon && <Icon className="h-5 w-5" />}
                {item.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white md:hidden">
        <div className="flex items-center justify-around px-2 py-1">
          {visibleItems.map((item) => {
            const Icon = iconMap[item.icon];
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2',
                  'min-h-[56px] min-w-[64px]',
                  'transition-colors duration-150',
                  active
                    ? 'text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      'h-6 w-6 transition-colors duration-150',
                      active && 'text-indigo-600'
                    )}
                  />
                )}
                <span
                  className={cn(
                    'text-[10px] font-medium leading-tight',
                    active ? 'text-indigo-600' : 'text-gray-500'
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* More button - only if there are hidden items */}
          {hasMoreItems && (
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2',
                'min-h-[56px] min-w-[64px]',
                'transition-colors duration-150',
                showMore
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <MoreHorizontal className="h-6 w-6" />
              <span className="text-[10px] font-medium leading-tight">More</span>
            </button>
          )}
        </div>

        {/* Safe area padding for iOS */}
        <div className="h-safe-area-inset-bottom bg-white" />
      </nav>
    </>
  );
}
