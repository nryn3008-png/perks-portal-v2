/**
 * Button component - MercuryOS Design System
 *
 * Fluid, intent-driven buttons with smooth transitions
 *
 * Variants: primary, secondary, outline, ghost, destructive
 * Sizes: sm, md (default), lg
 */

import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, BaseButtonProps {}

export interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement>, BaseButtonProps {
  href: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES (MercuryOS Design System)
// ─────────────────────────────────────────────────────────────────────────────

const baseStyles = [
  // Layout
  'inline-flex items-center justify-center gap-2',
  // Typography - MercuryOS: medium weight, clean
  'font-medium text-[14px] tracking-normal',
  // Shape - Pill (Design System)
  'rounded-full',
  // Transitions - Fast and smooth
  'transition-all duration-150 ease-out',
  // Focus
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
  // Disabled
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

const variants: Record<ButtonVariant, string> = {
  // Primary: Bridge Blue (#0038FF)
  primary: [
    'bg-[#0038FF] text-white',
    'hover:bg-[#0030E0]',
    'active:bg-[#0028C0] active:scale-[0.98]',
    'focus-visible:ring-[#0038FF]',
  ].join(' '),

  // Secondary: Light gray
  secondary: [
    'bg-gray-100 text-gray-700',
    'hover:bg-gray-200',
    'active:bg-gray-300 active:scale-[0.98]',
    'focus-visible:ring-gray-400',
  ].join(' '),

  // Outline: Border only
  outline: [
    'border border-gray-200 bg-transparent text-gray-700',
    'hover:bg-gray-50 hover:border-gray-300',
    'active:scale-[0.98]',
    'focus-visible:ring-gray-400',
  ].join(' '),

  // Ghost: No background
  ghost: [
    'bg-transparent text-gray-600',
    'hover:bg-gray-100 hover:text-gray-900',
    'active:scale-[0.98]',
    'focus-visible:ring-gray-400',
  ].join(' '),

  // Destructive: Red
  destructive: [
    'bg-red-600 text-white',
    'hover:bg-red-700',
    'active:bg-red-800 active:scale-[0.98]',
    'focus-visible:ring-red-500',
  ].join(' '),
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-2 py-1 text-[13px] min-h-[32px]',
  md: 'px-4 py-2 text-[14px] min-h-[38px]',
  lg: 'px-6 py-4 text-[14px] min-h-[44px]',
};

// ─────────────────────────────────────────────────────────────────────────────
// LOADING SPINNER
// ─────────────────────────────────────────────────────────────────────────────

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-4 w-4 animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BUTTON COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type="button"
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && <LoadingSpinner />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ─────────────────────────────────────────────────────────────────────────────
// LINK BUTTON COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      href,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          isLoading && 'opacity-50 pointer-events-none',
          className
        )}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && <LoadingSpinner />}
        {children}
      </a>
    );
  }
);

LinkButton.displayName = 'LinkButton';

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export { Button, LinkButton };
