'use client';

/**
 * User Menu Dropdown — MercuryOS Design System
 * Clickable avatar that opens a popover with user info and Bridge account link.
 */

import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';

const BRIDGE_ACCOUNT_URL = 'https://app.brdg.app';

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative pl-3 border-l border-gray-200">
      {/* Trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg p-1 -m-1 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-7 w-7 rounded-full object-cover ring-1 ring-gray-200"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-xs font-medium text-white">
            {user.name?.charAt(0) || 'U'}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-white shadow-lg ring-1 ring-gray-200/60 border border-gray-100 animate-fade-in z-50">
          <div className="p-4">
            {/* Header */}
            <p className="text-xs font-medium text-gray-400 mb-3">Signed in as</p>

            {/* User info */}
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-200"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-sm font-medium text-white">
                  {user.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-[13px] text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Bridge account link */}
          <div className="p-2">
            <a
              href={BRIDGE_ACCOUNT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              onClick={() => setOpen(false)}
            >
              {/* Bridge icon */}
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                <span className="text-[9px] font-bold text-white">B</span>
              </div>
              <span className="font-medium">Bridge account</span>
              <ExternalLink className="ml-auto h-3.5 w-3.5 text-gray-400" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
