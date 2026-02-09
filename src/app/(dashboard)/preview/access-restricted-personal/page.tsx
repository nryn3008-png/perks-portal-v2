/**
 * Preview: Access Restricted (Personal Email Only)
 *
 * Shows the restricted page for users who only have a personal email
 * connected — prompts them to connect a work email.
 *
 * URL: /preview/access-restricted-personal
 */

import { AccessRestrictedPage } from '@/components/access-restricted';

export default function AccessRestrictedPersonalPreview() {
  return (
    <AccessRestrictedPage
      connectedDomains={[]}
      userName="Demo User"
      userEmail="demo@gmail.com"
      totalPartnerCount={42}
    />
  );
}
