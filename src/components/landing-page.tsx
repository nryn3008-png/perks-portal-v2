'use client';

/**
 * Landing Page — MercuryOS Design System
 * Public page shown to unauthenticated users explaining the perks portal.
 * Auto-reloads when user returns from Bridge login in another tab.
 */

import { useEffect } from 'react';
import {
  DollarSign,
  Zap,
  ShieldCheck,
  Code,
  BarChart3,
  Cloud,
  Megaphone,
  Users,
  Briefcase,
  ArrowRight,
} from 'lucide-react';

const BRIDGE_LOGIN_URL = 'https://brdg.app/login';

/* ── Category data ─────────────────────────────────────────── */
const CATEGORIES = [
  { icon: Code, label: 'Dev Tools' },
  { icon: Cloud, label: 'Cloud & Infra' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: Megaphone, label: 'Marketing' },
  { icon: Users, label: 'HR & Hiring' },
  { icon: Briefcase, label: 'Finance & Legal' },
];

/* ── Benefit data ──────────────────────────────────────────── */
const BENEFITS = [
  {
    icon: DollarSign,
    title: 'Save Thousands on Tools',
    description:
      'Get exclusive discounts on the software and services your startup already uses — or should be using.',
  },
  {
    icon: Zap,
    title: 'Skip the Vendor Hunt',
    description:
      'Every deal is pre-negotiated. Just pick a perk and redeem it — most take under 5 minutes.',
  },
  {
    icon: ShieldCheck,
    title: 'Trusted & Vetted Partners',
    description:
      'Every offer comes from vendors verified by Bridge — so you can buy with confidence.',
  },
];

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
      {/* ── Hero Section ──────────────────────────────────── */}
      <div className="w-full max-w-2xl text-center pt-12 sm:pt-20 pb-10 sm:pb-14">
        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0038FF]/10 px-3.5 py-1 text-[12px] font-semibold text-[#0038FF] mb-5">
          <Zap className="h-3.5 w-3.5" />
          Exclusive to Bridge Members
        </span>

        <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4 leading-[1.15]">
          Save $10,000s on the tools
          <br className="hidden sm:block" /> your startup needs
        </h1>

        <p className="text-base sm:text-lg text-gray-500 max-w-lg mx-auto mb-8 leading-relaxed">
          Hundreds of exclusive discounts on software, services, and platforms —
          curated for founders building on Bridge.
        </p>

        <a
          href={BRIDGE_LOGIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#0038FF] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0038FF]/20 hover:bg-[#0030E0] hover:shadow-[#0038FF]/30 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0038FF]/40 focus-visible:ring-offset-2"
        >
          Log in to Browse Perks
          <ArrowRight className="h-4 w-4" />
        </a>

        <p className="text-[13px] text-gray-400 mt-4">
          Free for all Bridge members
        </p>
      </div>

      {/* ── Categories — "What you'll find inside" ────────── */}
      <div className="w-full max-w-3xl pb-12 sm:pb-16">
        <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
          What you&apos;ll find inside
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORIES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-gray-200/60 bg-white px-4 py-3.5 transition-colors hover:border-[#0038FF]/20 hover:bg-[#0038FF]/[0.02]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0038FF]/10">
                <Icon className="h-4.5 w-4.5 text-[#0038FF]" />
              </div>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Benefits ──────────────────────────────────────── */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-5 pb-16 sm:pb-20">
        {BENEFITS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex flex-col rounded-xl border border-gray-200/60 bg-white p-6"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0038FF]/10 mb-4">
              <Icon className="h-5 w-5 text-[#0038FF]" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
              {title}
            </h3>
            <p className="text-[13px] text-gray-500 leading-relaxed">
              {description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
