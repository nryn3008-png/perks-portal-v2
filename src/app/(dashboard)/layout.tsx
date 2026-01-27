import { AppShell } from '@/components/layout';

/**
 * Dashboard Layout
 * Wraps all authenticated pages with the app shell (sidebar + header)
 *
 * USER/FOUNDER PORTAL - No admin access
 */

const isAdmin = false;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell isAdmin={isAdmin}>
      {children}
    </AppShell>
  );
}
