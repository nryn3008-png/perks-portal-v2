import { resolveAuthWithAccounts } from '@/lib/bridge/auth';
import { LandingPage } from '@/components/landing-page';
import { AccessRestrictedPage } from '@/components/access-restricted';
import { PerksPageClient } from './perks-content';
import { accessService } from '@/lib/api/access-service';
import { getCachedWhitelistDomains } from '@/lib/api/access-cache';
import { getDefaultProvider } from '@/lib/providers';

/**
 * Perks Page — Server Component Wrapper
 *
 * Checks auth state + domain-based access:
 * - Not authenticated → shows the public landing page
 * - Authenticated but no access → shows access restricted page
 * - Authenticated with access → shows the full perks listing
 */
export default async function PerksPage() {
  const { authenticated, user } = await resolveAuthWithAccounts();

  if (!authenticated || !user) {
    return <LandingPage />;
  }

  // Check domain-based access
  const provider = await getDefaultProvider();

  if (provider) {
    const access = await accessService.resolveAccess(user, provider.id);

    if (!access.granted) {
      const whitelistDomains = await getCachedWhitelistDomains(provider.id);
      return (
        <AccessRestrictedPage
          connectedDomains={user.connectedDomains}
          userName={user.name}
          userEmail={user.email}
          totalPartnerCount={whitelistDomains.length}
        />
      );
    }
  }

  return <PerksPageClient />;
}
