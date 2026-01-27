import { redirect } from 'next/navigation';

/**
 * Admin index page - redirects to whitelisted domains
 */
export default function AdminPage() {
  redirect('/admin/whitelist');
}
