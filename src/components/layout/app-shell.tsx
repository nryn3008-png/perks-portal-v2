'use client';

/**
 * App Shell component - MercuryOS Design System
 *
 * Provides top navigation, main content area, and footer.
 * Supports two modes:
 *   - Default: centered max-w-7xl content with padding (perks pages)
 *   - Full-width: edge-to-edge content, no padding (admin pages with sidebar)
 *
 * Nested layouts signal full-width mode via LayoutContext.
 */

import { TopNav } from './top-nav';
import { Footer } from './footer';
import { UserProvider } from './user-context';
import { LayoutProvider, useLayout } from './layout-context';

interface AccessInfoProp {
  granted: boolean;
  reason: string;
  matchedDomain?: string;
}

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
  accessInfo?: AccessInfoProp;
}

/** Inner shell that reads layout context */
function ShellContent({
  children,
  user,
  accessInfo,
  showApiHealth,
}: {
  children: React.ReactNode;
  user: AppShellProps['user'];
  accessInfo?: AccessInfoProp;
  showApiHealth: boolean;
}) {
  const { fullWidth } = useLayout();

  return (
    <div className="flex min-h-screen flex-col bg-white transition-colors duration-150" style={{ overflowX: 'clip' }}>
      {/* Top Navigation */}
      <TopNav user={user} accessInfo={accessInfo} showApiHealth={showApiHealth} />

      {/* Main content area */}
      <main
        className={
          fullWidth
            ? 'w-full flex-1'
            : 'mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8'
        }
      >
        {children}
      </main>

      {/* Footer — hidden in full-width (admin) mode */}
      {!fullWidth && <Footer />}
    </div>
  );
}

export function AppShell({ children, user, accessInfo, showApiHealth = false }: AppShellProps) {
  return (
    <UserProvider user={user ? { id: user.id, email: user.email, name: user.name } : undefined}>
      <LayoutProvider>
        <ShellContent user={user} accessInfo={accessInfo} showApiHealth={showApiHealth}>
          {children}
        </ShellContent>
      </LayoutProvider>
    </UserProvider>
  );
}
