'use client';

/**
 * App Shell component - MercuryOS Design System
 * Clean layout with top navigation (no sidebar needed for single-page app)
 */

import { TopNav } from './top-nav';

interface AppShellProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="min-h-screen bg-white transition-colors duration-150">
      {/* Top Navigation */}
      <TopNav user={user} />

      {/* Main content area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
