import { AppShell } from '@/components/layout';
import { resolveAuth } from '@/lib/bridge/auth';

/**
 * Dashboard Layout
 * Wraps all authenticated pages with the app shell (top nav + content)
 *
 * Resolves the logged-in user from Bridge auth cookies and passes
 * user data to AppShell → TopNav for avatar display.
 *
 * API health badge is shown only in development.
 */

const isDev = process.env.NODE_ENV === 'development';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolve authenticated user from Bridge cookies
  const { user } = await resolveAuth();

  // Map to the shape expected by AppShell/TopNav
  const navUser = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      }
    : undefined;

  return (
    <AppShell
      isAdmin={user?.isAdmin ?? false}
      user={navUser}
      showApiHealth={isDev}
    >
      {children}
    </AppShell>
  );
}
