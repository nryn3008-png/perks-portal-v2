import { resolveAuth } from '@/lib/bridge/auth';
import { LandingPage } from '@/components/landing-page';
import { PerksPageClient } from './perks-content';

/**
 * Perks Page — Server Component Wrapper
 *
 * Checks auth state:
 * - Authenticated → shows the full perks listing
 * - Not authenticated → shows the public landing page
 */
export default async function PerksPage() {
  const { authenticated } = await resolveAuth();

  if (!authenticated) {
    return <LandingPage />;
  }

  return <PerksPageClient />;
}
