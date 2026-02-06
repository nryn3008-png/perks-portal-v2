import { resolveAuthWithAccounts } from '@/lib/bridge/auth';
import { LandingPage } from '@/components/landing-page';
import { AccessGate } from '@/components/access-gate';
import { PerksPageClient } from './perks-content';
import { accessService } from '@/lib/api/access-service';
import { getCachedWhitelistDomains } from '@/lib/api/access-cache';
import { getDefaultProvider } from '@/lib/providers';

/**
 * Perks Page — Server Component Wrapper
 *
 * Checks auth state + domain-based access:
 * - Not authenticated → shows the public landing page
 * - Authenticated → resolves access, wraps in AccessGate for scanning animation
 *   - Work domains present → 4s scanning animation → perks or restricted page
 *   - Personal email only → restricted page immediately (no scanning)
 */
export default async function PerksPage() {
  const { authenticated, user } = await resolveAuthWithAccounts();

  if (!authenticated || !user) {
    return <LandingPage />;
  }

  // Resolve domain-based access
  const provider = await getDefaultProvider();
  let accessGranted = true;
  let totalPartnerCount = 0;

  if (provider) {
    const access = await accessService.resolveAccess(user, provider.id);
    accessGranted = access.granted;

    if (!accessGranted) {
      const whitelistDomains = await getCachedWhitelistDomains(provider.id);
      totalPartnerCount = whitelistDomains.length;
    }
  }

  return (
    <AccessGate
      accessGranted={accessGranted}
      connectedDomains={user.connectedDomains}
      userName={user.name}
      userEmail={user.email}
      totalPartnerCount={totalPartnerCount}
    >
      <PerksPageClient />
    </AccessGate>
  );
}
