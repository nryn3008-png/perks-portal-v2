import { resolveAuthWithAccounts } from '@/lib/bridge/auth';
import { LandingPage } from '@/components/landing-page';
import { AccessGate } from '@/components/access-gate';
import { PerksPageClient } from './perks-content';
import { accessService } from '@/lib/api/access-service';
import { getCachedWhitelistDomains } from '@/lib/api/access-cache';
import { getDefaultProvider } from '@/lib/providers';

export default async function PerksPage() {
  const { authenticated, user } = await resolveAuthWithAccounts();

  if (!authenticated || !user) {
    return <LandingPage />;
  }

  const provider = await getDefaultProvider();
  let accessGranted = true;
  let matchedDomain: string | undefined;
  let animationShown = false;
  let totalPartnerCount = 0;

  if (provider) {
    const access = await accessService.resolveAccess(user, provider.id);
    accessGranted = access.granted;
    matchedDomain = access.matchedDomain;
    animationShown = access.animationShown ?? false;

    if (!accessGranted) {
      const whitelistDomains = await getCachedWhitelistDomains(provider.id);
      totalPartnerCount = whitelistDomains.length;
    }
  }

  return (
    <AccessGate
      accessGranted={accessGranted}
      matchedDomain={matchedDomain}
      animationShown={animationShown}
      connectedDomains={user.connectedDomains}
      userName={user.name}
      userEmail={user.email}
      totalPartnerCount={totalPartnerCount}
    >
      <PerksPageClient />
    </AccessGate>
  );
}
