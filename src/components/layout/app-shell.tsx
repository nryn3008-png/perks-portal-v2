'use client';

/**
 * App Shell component - MercuryOS Design System
 * Clean layout with top navigation (no sidebar needed for single-page app)
 */

import { TopNav } from './top-nav';
import { Footer } from './footer';
import { UserProvider } from './user-context';

interface AppShellProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  showApiHealth?: boolean;
  user?: {
    id?: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export function AppShell({ children, user, showApiHealth = false }: AppShellProps) {
  return (
    <UserProvider user={user ? { id: user.id, email: user.email, name: user.name } : undefined}>
      <div className="flex min-h-screen flex-col bg-white transition-colors duration-150" style={{ overflowX: 'clip' }}>
        {/* Top Navigation */}
        <TopNav user={user} showApiHealth={showApiHealth} />

        {/* Main content area */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </UserProvider>
  );
}
