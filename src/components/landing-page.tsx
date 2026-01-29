'use client';

/**
 * Landing Page — MercuryOS Design System
 * Public page shown to unauthenticated users explaining the perks portal.
 * Auto-reloads when user returns from Bridge login in another tab.
 */

import { useEffect } from 'react';
import { Gift, Sparkles, Shield, TrendingUp } from 'lucide-react';

const BRIDGE_LOGIN_URL = 'https://brdg.app/login';

export function LandingPage() {
  // Auto-reload when user returns to this tab after logging in on Bridge
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        // Check if authToken cookie now exists
        const hasAuth = document.cookie
          .split(';')
          .some((item) => item.trim().startsWith('authToken'));
        if (hasAuth) {
          window.location.reload();
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="flex flex-col items-center animate-fade-in">
      {/* Hero Section */}
      <div className="w-full max-w-2xl text-center py-12 sm:py-20">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0038FF] to-[#0030E0] mb-6">
          <Gift className="h-6 w-6 text-white" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
          Exclusive Perks for Bridge Members
        </h1>

        <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
          Access hundreds of exclusive offers from trusted partners — worth
          millions in savings for your startup.
        </p>

        <a
          href={BRIDGE_LOGIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0038FF] px-6 py-3 text-sm font-medium text-white hover:bg-[#0030E0] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0038FF]/40 focus-visible:ring-offset-2"
        >
          Login with Bridge account
        </a>

        <p className="text-[13px] text-gray-400 mt-4">
          Sign in with your Bridge account to browse all perks
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-6 pb-16">
        <FeatureCard
          icon={<Sparkles className="h-5 w-5 text-[#0038FF]" />}
          title="Exclusive Offers"
          description="Access perks and discounts not available anywhere else"
        />
        <FeatureCard
          icon={<Shield className="h-5 w-5 text-[#0038FF]" />}
          title="Trusted Partners"
          description="Every vendor is vetted and verified by our team"
        />
        <FeatureCard
          icon={<TrendingUp className="h-5 w-5 text-[#0038FF]" />}
          title="Real Savings"
          description="Thousands in discounts across software, services, and more"
        />
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center rounded-xl border border-gray-200/60 bg-white p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0038FF]/10 mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-[13px] text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
