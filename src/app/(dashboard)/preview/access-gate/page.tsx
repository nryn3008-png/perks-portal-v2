/**
 * Preview: Access Gate Scanning Animation
 *
 * Renders the full 8s scanning animation → 2.5s granted screen.
 * Forces animation to play by setting animationShown=false.
 *
 * URL: /preview/access-gate
 */

import { AccessGate } from '@/components/access-gate';

export default function AccessGatePreview() {
  return (
    <AccessGate
      accessGranted={true}
      matchedDomain="a16z.com"
      accessReason="portfolio_match"
      animationShown={false}
      connectedDomains={['acmestartup.com']}
      userName="Demo User"
      userEmail="demo@acmestartup.com"
      totalPartnerCount={42}
    >
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 text-sm">Perks list would appear here after animation completes</p>
      </div>
    </AccessGate>
  );
}
