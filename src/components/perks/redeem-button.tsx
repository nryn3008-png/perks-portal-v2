'use client';

import { Gift } from 'lucide-react';
import { useUser } from '@/components/layout/user-context';

interface RedeemButtonProps {
  getprovenLink: string;
  offerId: number;
  offerName: string;
  vendorName: string;
  estimatedValue?: number | null;
}

export function RedeemButton({
  getprovenLink,
  offerId,
  offerName,
  vendorName,
  estimatedValue,
}: RedeemButtonProps) {
  const user = useUser();

  async function handleClick() {
    // Fire tracking in background — don't block the redirect
    try {
      fetch('/api/track/redemption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          user_email: user.email,
          offer_id: offerId,
          offer_name: offerName,
          vendor_name: vendorName,
          estimated_value: estimatedValue,
          getproven_link: getprovenLink,
        }),
      });
    } catch {
      // Silently fail — don't block redemption
    }

    // Open GetProven link in new tab
    window.open(getprovenLink, '_blank', 'noopener,noreferrer');
  }

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm
        transition-all duration-200 cursor-pointer w-full
        bg-[#0038FF]
        text-white font-medium
        shadow-[0_4px_16px_rgba(0,56,255,0.3),0_0_0_1px_rgba(255,255,255,0.1)_inset]
        hover:bg-[#0030E0] hover:shadow-[0_8px_24px_rgba(0,56,255,0.4)]
        active:scale-[0.98]
      `}
    >
      <Gift className="w-4 h-4" />
      Redeem Offer
    </button>
  );
}
