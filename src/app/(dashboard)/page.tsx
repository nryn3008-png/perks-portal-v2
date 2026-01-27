import { redirect } from 'next/navigation';

/**
 * Root Page - Redirects to All Perks
 *
 * Product decision: All Perks is now the primary landing experience.
 * This page redirects to /perks immediately.
 *
 * Previous dashboard functionality has been deprecated.
 * Dashboard stats (total perks, total value) are now shown
 * directly in the All Perks page header.
 */
export default function RootPage() {
  redirect('/perks');
}
