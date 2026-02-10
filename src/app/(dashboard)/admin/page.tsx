import { redirect } from 'next/navigation';

/**
 * Admin index page - redirects to analytics (first tab)
 */
export default function AdminPage() {
  redirect('/admin/analytics');
}
