/**
 * SearchInput component - MercuryOS Design System
 *
 * Fluid, minimal search input with smooth transitions
 */

import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Callback when clear button is clicked */
  onClear?: () => void;
  /** Hide the clear button even when value exists */
  hideClearButton?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES (MercuryOS Design System)
// ─────────────────────────────────────────────────────────────────────────────

// Container with MercuryOS styling
const containerStyles = [
  // Layout
  'flex items-center gap-2',
  // Shape - Rounded
  'rounded-full',
  // Padding
  'px-4 py-2',
  // Background
  'bg-gray-50',
  // Border
  'border border-gray-200',
  // Transitions
  'transition-all duration-150 ease-out',
  // Hover
  'hover:bg-white hover:border-[#0038FF]/40',
  // Focus-within
  'focus-within:bg-white focus-within:border-[#0038FF] focus-within:ring-2 focus-within:ring-[#0038FF]/20',
].join(' ');

// Input - transparent
const inputStyles = [
  'flex-1 min-w-0',
  'bg-transparent border-none outline-none',
  'focus:outline-none focus:ring-0',
  'text-gray-900',
  'placeholder:text-gray-400',
  'text-[14px]',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ');

// Icons
const iconStyles = 'h-4 w-4 text-gray-400 flex-shrink-0';

// Clear button
const clearButtonStyles = [
  'flex-shrink-0 p-1 -m-1 rounded-full',
  'text-gray-400',
  'hover:text-gray-600 hover:bg-gray-100',
  'transition-colors duration-150',
  'focus:outline-none',
].join(' ');

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      value,
      onClear,
      hideClearButton = false,
      disabled,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const hasValue = value !== undefined && value !== '';
    const showClearButton = hasValue && !hideClearButton && !disabled && onClear;

    return (
      <div className={cn(containerStyles, className)}>
        {/* Search icon */}
        <Search className={iconStyles} aria-hidden="true" />

        {/* Input */}
        <input
          ref={ref}
          type="text"
          value={value}
          disabled={disabled}
          aria-label={ariaLabel || 'Search'}
          className={inputStyles}
          {...props}
        />

        {/* Clear button */}
        {showClearButton && (
          <button
            type="button"
            onClick={onClear}
            className={clearButtonStyles}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export { SearchInput };
