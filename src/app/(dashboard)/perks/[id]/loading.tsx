/**
 * Offer Detail Page Loading Skeleton
 * Mercury OS-inspired design with glassmorphic effects
 */

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function SkeletonPulse({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200/60 ${className}`} />
  );
}

function GlassCardSkeleton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/70 backdrop-blur-xl
        border border-white/20
        shadow-[0_8px_32px_rgba(0,0,0,0.08)]
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
      <div className="relative">{children}</div>
    </div>
  );
}

function FloatingPanelSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        sticky top-6
        rounded-3xl overflow-hidden
        bg-gradient-to-b from-white/80 to-white/60
        backdrop-blur-2xl
        border border-white/30
        shadow-[0_24px_64px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.5)_inset]
      "
    >
      <div className="relative">{children}</div>
    </div>
  );
}

export default function OfferDetailLoading() {
  return (
    <div className="min-h-screen">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-indigo-50/40 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-50/30 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Back Navigation */}
        <Link
          href="/perks"
          className="
            inline-flex items-center gap-2 mb-8
            text-sm font-medium text-gray-500
            hover:text-gray-900
            transition-colors duration-200
            rounded-lg px-2 py-1 -ml-2
          "
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Perks</span>
        </Link>

        <div className="grid lg:grid-cols-[1fr,380px] gap-8">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Hero Section Skeleton */}
            <GlassCardSkeleton className="p-8">
              {/* Vendor Identity */}
              <div className="flex items-center gap-4 mb-6">
                <SkeletonPulse className="w-16 h-16 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <SkeletonPulse className="h-5 w-32" />
                  <SkeletonPulse className="h-4 w-24" />
                </div>
                <SkeletonPulse className="h-7 w-20 rounded-full" />
              </div>

              {/* Title */}
              <div className="space-y-2 mb-4">
                <SkeletonPulse className="h-8 w-3/4" />
                <SkeletonPulse className="h-8 w-1/2" />
              </div>

              {/* Investment Levels */}
              <div className="flex flex-wrap gap-2 mb-6">
                <SkeletonPulse className="h-6 w-20 rounded-md" />
                <SkeletonPulse className="h-6 w-24 rounded-md" />
                <SkeletonPulse className="h-6 w-16 rounded-md" />
              </div>

              {/* Value Metrics */}
              <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200/50">
                <SkeletonPulse className="h-20 w-40 rounded-2xl" />
                <SkeletonPulse className="h-20 w-44 rounded-2xl" />
              </div>
            </GlassCardSkeleton>

            {/* Description Skeleton */}
            <GlassCardSkeleton className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <SkeletonPulse className="w-9 h-9 rounded-xl" />
                <SkeletonPulse className="h-5 w-32" />
              </div>
              <div className="space-y-2">
                <SkeletonPulse className="h-4 w-full" />
                <SkeletonPulse className="h-4 w-full" />
                <SkeletonPulse className="h-4 w-5/6" />
                <SkeletonPulse className="h-4 w-4/5" />
                <SkeletonPulse className="h-4 w-3/4" />
              </div>
            </GlassCardSkeleton>

            {/* Terms Skeleton */}
            <div className="rounded-2xl bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SkeletonPulse className="w-9 h-9 rounded-xl" />
                  <SkeletonPulse className="h-5 w-40" />
                </div>
                <SkeletonPulse className="w-5 h-5 rounded" />
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <aside className="lg:self-start">
            <FloatingPanelSkeleton>
              <div className="p-6">
                <SkeletonPulse className="h-6 w-36 mb-6" />

                <div className="space-y-4 mb-6">
                  {/* Promo Code */}
                  <div>
                    <SkeletonPulse className="h-3 w-20 mb-2" />
                    <SkeletonPulse className="h-12 w-full rounded-xl" />
                  </div>

                  {/* How to Redeem */}
                  <div>
                    <SkeletonPulse className="h-3 w-24 mb-2" />
                    <div className="space-y-2">
                      <SkeletonPulse className="h-4 w-full" />
                      <SkeletonPulse className="h-4 w-5/6" />
                      <SkeletonPulse className="h-4 w-4/5" />
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <SkeletonPulse className="h-12 w-full rounded-2xl" />

                <SkeletonPulse className="h-3 w-48 mx-auto mt-4" />

                {/* Eligibility */}
                <div className="mt-6 pt-6 border-t border-gray-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <SkeletonPulse className="w-4 h-4 rounded" />
                    <SkeletonPulse className="h-3 w-24" />
                  </div>
                  <SkeletonPulse className="h-4 w-32" />
                </div>
              </div>
            </FloatingPanelSkeleton>
          </aside>
        </div>
      </div>
    </div>
  );
}
