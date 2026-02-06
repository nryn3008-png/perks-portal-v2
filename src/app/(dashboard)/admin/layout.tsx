import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { FullWidthMode } from '@/components/layout';

/**
 * Admin Layout
 *
 * Full-width sidebar + content layout for all /admin/* pages.
 * FullWidthMode tells AppShell to drop max-width and padding
 * so the sidebar sits flush against the left edge.
 */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <FullWidthMode />
      <AdminSidebar />
      <div className="flex-1 min-w-0 px-6 py-8 lg:px-10">
        {children}
      </div>
    </div>
  );
}
