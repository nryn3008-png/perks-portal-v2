'use client';

/**
 * Landing Page — Perks Portal
 *
 * Design: Linear/Vercel/Stripe-inspired minimal aesthetic
 * Animations: Scroll-triggered reveals, staggered entrances, marquee
 * System: Bridge Blue #0038FF, 8px grid, Mulish, rounded-full CTAs
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowRight,
  Sparkles,
  Code,
  Cloud,
  BarChart3,
  Megaphone,
  Users,
  Briefcase,
  Zap,
  Shield,
  Clock,
  Gift,
  TrendingUp,
  Search,
  ChevronRight,
} from 'lucide-react';

const BRIDGE_LOGIN_URL = 'https://brdg.app/login';

/* ── Data ────────────────────────────────────────────────────── */

const STATS = [
  { value: 400, suffix: '+', label: 'Exclusive Perks', icon: Gift },
  { value: 2, prefix: '$', suffix: 'M+', label: 'Saved by Founders', icon: TrendingUp },
  { value: 300, suffix: '+', label: 'Verified Partners', icon: Shield },
];

const PARTNERS = [
  { name: 'AWS', domain: 'aws.amazon.com' },
  { name: 'Notion', domain: 'notion.so' },
  { name: 'Figma', domain: 'figma.com' },
  { name: 'Linear', domain: 'linear.app' },
  { name: 'Vercel', domain: 'vercel.com' },
  { name: 'Stripe', domain: 'stripe.com' },
  { name: 'HubSpot', domain: 'hubspot.com' },
  { name: 'Slack', domain: 'slack.com' },
  { name: 'Intercom', domain: 'intercom.com' },
  { name: 'Segment', domain: 'segment.com' },
  { name: 'Datadog', domain: 'datadoghq.com' },
  { name: 'Loom', domain: 'loom.com' },
];

const CATEGORIES = [
  { icon: Code, label: 'Dev Tools', count: '45+' },
  { icon: Cloud, label: 'Cloud & Infra', count: '30+' },
  { icon: BarChart3, label: 'Analytics', count: '25+' },
  { icon: Megaphone, label: 'Marketing', count: '35+' },
  { icon: Users, label: 'HR & Hiring', count: '20+' },
  { icon: Briefcase, label: 'Finance & Legal', count: '25+' },
];

const BENEFITS = [
  {
    icon: Zap,
    title: 'Instant Access',
    description: 'No negotiations, no waiting. Every deal is pre-approved and ready to redeem in minutes.',
  },
  {
    icon: Shield,
    title: 'Vetted Partners',
    description: 'Every vendor is verified by Bridge. Quality tools from companies founders actually trust.',
  },
  {
    icon: Clock,
    title: 'Always Updated',
    description: 'New perks added weekly. We continuously negotiate better deals as the portfolio grows.',
  },
];

const STEPS = [
  { step: '01', title: 'Sign in with Bridge', desc: 'Use your existing Bridge account' },
  { step: '02', title: 'Browse & search', desc: 'Filter by category, vendor, or keyword' },
  { step: '03', title: 'Redeem instantly', desc: 'No approvals or extra steps needed' },
];

/* ── Hooks ───────────────────────────────────────────────────── */

/**
 * IntersectionObserver hook — adds .scroll-visible when element enters viewport
 */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

/**
 * Animated counter — counts up from 0 to target when visible
 */
function useCountUp(target: number, isVisible: boolean, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let raf: number;

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    }

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isVisible, target, duration]);

  return count;
}

/* ── Components ──────────────────────────────────────────────── */

function StatCard({
  value,
  prefix,
  suffix,
  label,
  icon: Icon,
  isVisible,
  delay,
}: {
  value: number;
  prefix?: string;
  suffix: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isVisible: boolean;
  delay: number;
}) {
  const count = useCountUp(value, isVisible);

  return (
    <div
      className={`flex items-center justify-center gap-4 ${
        isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0038FF]/10 transition-transform duration-200 hover:scale-110">
        <Icon className="h-5 w-5 text-[#0038FF]" />
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight tabular-nums">
          {prefix}{count}{suffix}
        </div>
        <div className="text-[13px] text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function MarqueeRow({ reverse = false }: { reverse?: boolean }) {
  const items = [...PARTNERS, ...PARTNERS]; // Duplicate for seamless loop

  return (
    <div className="flex overflow-hidden">
      <div className={`flex shrink-0 items-center gap-16 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}>
        {items.map((partner, i) => (
          <div
            key={`${partner.name}-${i}`}
            className="shrink-0 flex items-center gap-2 select-none cursor-default whitespace-nowrap group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://www.google.com/s2/favicons?domain=${partner.domain}&sz=64`}
              alt={partner.name}
              className="h-6 w-6 rounded object-contain opacity-40 group-hover:opacity-70 transition-opacity duration-150"
              loading="lazy"
            />
            <span className="text-[14px] font-semibold text-gray-400 group-hover:text-gray-600 transition-colors duration-150">
              {partner.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */

export function LandingPage() {
  const stats = useScrollReveal();
  const partners = useScrollReveal();
  const categories = useScrollReveal();
  const benefits = useScrollReveal();
  const steps = useScrollReveal();
  const cta = useScrollReveal();

  // Auto-reload when user returns after logging in
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
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
    <div className="flex flex-col items-center">

      {/* ═══════════════════════════════════════════════════════════
          HERO — Staggered entrance
      ═══════════════════════════════════════════════════════════ */}
      <section className="w-full max-w-5xl text-center pt-16 sm:pt-32 pb-16 px-6">
        {/* Badge — slide down */}
        <div className="animate-fade-in-up anim-delay-1 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] text-gray-600 shadow-sm mb-8">
          <Sparkles className="h-4 w-4 text-[#0038FF]" />
          <span>Exclusive to Bridge Members</span>
        </div>

        {/* Headline — staggered lines */}
        <h1 className="animate-fade-in-up anim-delay-2 text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.08] mb-6">
          Save thousands on the
          <br />
          tools you <span className="text-[#0038FF]">already use</span>
        </h1>

        {/* Sub */}
        <p className="animate-fade-in-up anim-delay-3 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
          Pre-negotiated discounts on 400+ SaaS products, services, and platforms.
          Curated exclusively for Bridge portfolio founders.
        </p>

        {/* CTA */}
        <div className="animate-fade-in-up anim-delay-4 flex flex-col items-center gap-4">
          <a
            href={BRIDGE_LOGIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="
              group inline-flex items-center gap-2 rounded-full
              bg-[#0038FF] px-8 py-4
              text-[14px] font-semibold text-white
              shadow-[0_4px_24px_rgba(0,56,255,0.3)]
              hover:bg-[#0030E0] hover:shadow-[0_8px_32px_rgba(0,56,255,0.4)] hover:scale-[1.02]
              active:scale-[0.98]
              transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0038FF]/40 focus-visible:ring-offset-2
              animate-glow-pulse
            "
          >
            Browse All Perks
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
          <span className="text-[13px] text-gray-500">
            Log in with Bridge account · Free for all Bridge members
          </span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STATS — Count-up + staggered reveal
      ═══════════════════════════════════════════════════════════ */}
      <section ref={stats.ref} className="w-full max-w-5xl px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8 border-y border-gray-100">
          {STATS.map(({ value, prefix, suffix, label, icon }, i) => (
            <StatCard
              key={label}
              value={value}
              prefix={prefix}
              suffix={suffix}
              label={label}
              icon={icon}
              isVisible={stats.isVisible}
              delay={i * 150}
            />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PARTNERS — Infinite marquee
      ═══════════════════════════════════════════════════════════ */}
      <section ref={partners.ref} className="w-full max-w-5xl px-6 pb-24 overflow-hidden">
        <p
          className={`text-center text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-8 ${
            partners.isVisible ? 'animate-fade-in' : 'opacity-0'
          }`}
        >
          Perks from companies you already know
        </p>
        <div className="space-y-6">
          <MarqueeRow />
          <MarqueeRow reverse />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CATEGORIES — Staggered card reveal
      ═══════════════════════════════════════════════════════════ */}
      <section ref={categories.ref} className="w-full max-w-5xl px-6 pb-24">
        <div
          className={`text-center mb-12 ${
            categories.isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'
          }`}
        >
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
            Everything your startup needs
          </h2>
          <p className="text-[14px] text-gray-500 max-w-lg mx-auto">
            Organized by category, searchable by name. New perks added every week.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {CATEGORIES.map(({ icon: Icon, label, count }, i) => (
            <div
              key={label}
              className={`
                group flex items-center gap-4
                rounded-xl border border-gray-200 bg-white p-6
                transition-all duration-200
                hover:border-[#0038FF]/20 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1
                ${categories.isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}
              `}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 group-hover:bg-[#0038FF]/10 transition-colors duration-200">
                <Icon className="h-5 w-5 text-gray-500 group-hover:text-[#0038FF] transition-colors duration-200" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-gray-900">{label}</div>
                <div className="text-[12px] text-gray-500">{count} perks</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          BENEFITS — Slide up on scroll
      ═══════════════════════════════════════════════════════════ */}
      <section ref={benefits.ref} className="w-full max-w-5xl px-6 pb-24">
        <div
          className={`text-center mb-12 ${
            benefits.isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'
          }`}
        >
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
            Built for founders who move fast
          </h2>
          <p className="text-[14px] text-gray-500 max-w-lg mx-auto">
            No negotiation, no friction. Just savings.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {BENEFITS.map(({ icon: Icon, title, description }, i) => (
            <div
              key={title}
              className={`
                group flex flex-col p-8 rounded-xl border border-gray-100 bg-gray-50/50
                transition-all duration-200
                hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1
                ${benefits.isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}
              `}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm mb-6 transition-transform duration-200 group-hover:scale-110">
                <Icon className="h-5 w-5 text-[#0038FF]" />
              </div>
              <h3 className="text-[14px] font-bold text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          HOW IT WORKS — Sequential step reveal + connector lines
      ═══════════════════════════════════════════════════════════ */}
      <section ref={steps.ref} className="w-full max-w-5xl px-6 pb-24">
        <div
          className={`text-center mb-12 ${
            steps.isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'
          }`}
        >
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Three steps to savings
          </h2>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Connector lines (desktop only) */}
          <div className="hidden sm:block absolute top-6 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px">
            <div
              className={`h-full bg-gray-200 origin-left ${
                steps.isVisible ? 'animate-line-draw' : 'scale-x-0'
              }`}
              style={{ animationDelay: '400ms' }}
            />
          </div>

          {STEPS.map(({ step, title, desc }, i) => (
            <div
              key={step}
              className={`relative text-center ${
                steps.isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'
              }`}
              style={{ animationDelay: `${200 + i * 200}ms` }}
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0038FF] text-white text-[14px] font-bold mb-4 shadow-[0_4px_16px_rgba(0,56,255,0.25)] relative z-10">
                {step}
              </div>
              <h3 className="text-[14px] font-semibold text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-[13px] text-gray-500">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FINAL CTA — Animated gradient + glow button
      ═══════════════════════════════════════════════════════════ */}
      <section ref={cta.ref} className="w-full max-w-5xl px-6 pb-24">
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#0038FF] to-[#0085FF] px-8 py-16 sm:px-16 sm:py-24 text-center ${
            cta.isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'
          }`}
        >

          <div className="relative">
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Start saving today
            </h2>
            <p className="text-[14px] text-white max-w-md mx-auto mb-8 leading-relaxed">
              Join thousands of founders who&apos;ve saved millions
              on the tools they use every day.
            </p>
            <a
              href={BRIDGE_LOGIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="
                group inline-flex items-center gap-2 rounded-full
                bg-white px-8 py-4
                text-[14px] font-semibold text-gray-900
                shadow-[0_4px_24px_rgba(255,255,255,0.15)]
                hover:bg-gray-100 hover:shadow-[0_8px_32px_rgba(255,255,255,0.2)] hover:scale-[1.02]
                active:scale-[0.98]
                transition-all duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0038FF]
              "
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </section>


    </div>
  );
}
