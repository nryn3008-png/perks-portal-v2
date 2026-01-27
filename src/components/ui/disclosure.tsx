'use client';

/**
 * Disclosure / Accordion Component - MercuryOS Design System
 * A collapsible section with keyboard navigation and accessibility support
 */

import { useState, type ReactNode } from 'react';
import { ChevronDown, Database } from 'lucide-react';

interface DisclosureProps {
  trigger: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
}

export function Disclosure({
  trigger,
  children,
  defaultOpen = false,
  icon,
}: DisclosureProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-[14px] font-medium text-gray-500 hover:bg-gray-50 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-inset"
      >
        <span className="flex items-center gap-2">
          {icon || <Database className="h-4 w-4" />}
          {trigger}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 max-h-[600px] overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );
}
