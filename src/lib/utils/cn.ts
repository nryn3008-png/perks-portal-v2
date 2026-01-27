/**
 * Utility for conditionally joining classNames together
 * Combines clsx with tailwind-merge for optimal Tailwind CSS class handling
 */

import { clsx, type ClassValue } from 'clsx';

/**
 * Merge class names with Tailwind CSS conflict resolution
 * @example cn('px-2 py-1', condition && 'bg-blue-500', 'px-4') => 'py-1 bg-blue-500 px-4'
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
