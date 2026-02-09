/**
 * Preview: Access Restricted Page
 *
 * Renders the access-restricted page with mock data so stakeholders
 * can preview the UI without needing a denied-access account.
 *
 * URL: /preview/access-restricted
 *
 * Only accessible to authenticated admin users (middleware enforced).
 * To remove in production, delete this directory.
 */

import { AccessRestrictedPage } from '@/components/access-restricted';

export default function AccessRestrictedPreview() {
  return (
    <AccessRestrictedPage
      connectedDomains={['acmestartup.com', 'foundermail.io']}
      userName="Demo User"
      userEmail="demo@acmestartup.com"
      totalPartnerCount={42}
    />
  );
}
