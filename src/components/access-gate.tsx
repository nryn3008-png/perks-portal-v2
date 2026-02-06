'use client';

/**
 * Access Gate — Domain Scanning Animation
 *
 * Shows a modern "scanning" animation when verifying a user's domain
 * against the partner network. Runs for a minimum of 4 seconds before
 * revealing the result (granted → perks, denied → restricted page).
 *
 * Skips animation for:
 * - Personal email only (no work domains to scan)
 * - Return visits within the same session (sessionStorage flag)
 * - Users with prefers-reduced-motion enabled
 *
 * Design: MercuryOS — Bridge Blue #0038FF, Mulish, rounded-xl
 */

import { useState, useEffect, useCallback } from 'react';
import { Shield, Building2 } from 'lucide-react';
import { AccessRestrictedPage } from '@/components/access-restricted';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface AccessGateProps {
  accessGranted: boolean;
  connectedDomains: string[];
  userName: string;
  userEmail: string;
  totalPartnerCount: number;
  children: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SCAN_PHASES = [
  'Initializing secure connection...',
  'Scanning domain...',
  'Checking portfolio access...',
  'Verifying credentials...',
];

const PHASE_DURATION = 1000; // 1s per phase
const TOTAL_DURATION = 4000; // 4s total
const FADE_OUT_OFFSET = 400; // start fade 400ms before end
const SESSION_KEY = 'access-gate-shown';

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN CHIP (scanning variant)
// ─────────────────────────────────────────────────────────────────────────────

function ScanDomainChip({
  domain,
  index,
  isActive,
}: {
  domain: string;
  index: number;
  isActive: boolean;
}) {
  return (
    <div
      className={`
        inline-flex items-center gap-2 rounded-lg px-3 py-2
        border transition-all duration-300
        animate-fade-in-up anim-delay-${Math.min(index + 1, 6)}
        ${
          isActive
            ? 'bg-[#0038FF]/5 border-[#0038FF]/30 shadow-sm shadow-[#0038FF]/10'
            : 'bg-white border-gray-200'
        }
      `}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt=""
        className="h-4 w-4 rounded-sm"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (target.nextElementSibling) {
            (target.nextElementSibling as HTMLElement).classList.remove('hidden');
          }
        }}
      />
      <Building2 className="hidden h-4 w-4 text-gray-400" />
      <span
        className={`text-[13px] font-medium transition-colors duration-300 ${
          isActive ? 'text-[#0038FF]' : 'text-gray-700'
        }`}
      >
        {domain}
      </span>

      {/* Active indicator dot */}
      {isActive && (
        <span className="h-1.5 w-1.5 rounded-full bg-[#0038FF] animate-pulse" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCANNING ANIMATION
// ─────────────────────────────────────────────────────────────────────────────

function ScanningScreen({
  connectedDomains,
  scanPhaseIndex,
  fadeOut,
}: {
  connectedDomains: string[];
  scanPhaseIndex: number;
  fadeOut: boolean;
}) {
  // Highlight domains sequentially during phase 2 (index 2 = "Checking portfolio access...")
  const activeDomainIndex = scanPhaseIndex >= 2 ? (scanPhaseIndex - 2) : -1;

  return (
    <div
      className={`
        min-h-[60vh] flex items-center justify-center px-4
        transition-opacity duration-500
        ${fadeOut ? 'opacity-0' : 'opacity-100'}
      `}
    >
      <div className="w-full max-w-md text-center space-y-8">

        {/* ── Scanner Icon with Pulse Rings ──────────────────────── */}
        <div className="relative flex items-center justify-center h-32">
          {/* Pulse ring 1 */}
          <div
            className="absolute h-20 w-20 rounded-full border-2 border-[#0038FF]/20 animate-scan-pulse-ring"
          />
          {/* Pulse ring 2 (delayed) */}
          <div
            className="absolute h-20 w-20 rounded-full border-2 border-[#0038FF]/15 animate-scan-pulse-ring"
            style={{ animationDelay: '0.6s' }}
          />
          {/* Pulse ring 3 (more delayed) */}
          <div
            className="absolute h-20 w-20 rounded-full border-2 border-[#0038FF]/10 animate-scan-pulse-ring"
            style={{ animationDelay: '1.2s' }}
          />

          {/* Center shield icon */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0038FF] to-[#0030E0] animate-scan-glow z-10">
            <Shield className="h-7 w-7 text-white" />
          </div>
        </div>

        {/* ── Title ──────────────────────────────────────────────── */}
        <div className="space-y-2 animate-fade-in">
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Verifying Access
          </h1>
          <p className="text-[13px] text-gray-500">
            Checking your domain against our partner network
          </p>
        </div>

        {/* ── Domain Targets with Scan Line ──────────────────────── */}
        <div className="relative rounded-xl border border-gray-200 bg-gray-50/50 p-6 overflow-hidden">
          {/* Scanning line overlay */}
          <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none z-10">
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#0038FF]/60 to-transparent animate-scan-line" />
          </div>

          {/* Domain chips */}
          <div className="relative flex flex-wrap justify-center gap-2">
            {connectedDomains.map((domain, i) => (
              <ScanDomainChip
                key={domain}
                domain={domain}
                index={i}
                isActive={i === activeDomainIndex}
              />
            ))}
          </div>
        </div>

        {/* ── Status Text (fades between phases) ─────────────────── */}
        <div className="h-6 flex items-center justify-center">
          <p
            key={scanPhaseIndex}
            className="text-[13px] font-medium text-[#0038FF] animate-fade-in"
          >
            {SCAN_PHASES[scanPhaseIndex]}
          </p>
        </div>

        {/* ── Progress Bar ───────────────────────────────────────── */}
        <div className="mx-auto w-48 h-1 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#0038FF] to-[#0030E0] animate-progress-fill" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function AccessGate({
  accessGranted,
  connectedDomains,
  userName,
  userEmail,
  totalPartnerCount,
  children,
}: AccessGateProps) {
  const [phase, setPhase] = useState<'scanning' | 'result'>('scanning');
  const [scanPhaseIndex, setScanPhaseIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  // Check if we should skip the animation
  const shouldSkip = useCallback(() => {
    // No work domains → personal email flow, nothing to scan
    if (connectedDomains.length === 0) return true;

    // Return visit within same session
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return true;
    } catch {
      // sessionStorage not available — don't skip
    }

    // Reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }

    return false;
  }, [connectedDomains.length]);

  useEffect(() => {
    // Skip animation if conditions met
    if (shouldSkip()) {
      setPhase('result');
      return;
    }

    // Mark as shown for this session
    try {
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch {
      // Ignore
    }

    // Progress through scan phases
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase transitions at 1s, 2s, 3s
    for (let i = 1; i < SCAN_PHASES.length; i++) {
      timers.push(
        setTimeout(() => setScanPhaseIndex(i), i * PHASE_DURATION)
      );
    }

    // Start fade-out before end
    timers.push(
      setTimeout(() => setFadeOut(true), TOTAL_DURATION - FADE_OUT_OFFSET)
    );

    // Switch to result
    timers.push(
      setTimeout(() => setPhase('result'), TOTAL_DURATION)
    );

    return () => timers.forEach(clearTimeout);
  }, [shouldSkip]);

  // ── Result phase ──────────────────────────────────────────────────────────
  if (phase === 'result') {
    if (accessGranted) {
      return <div className="animate-fade-in">{children}</div>;
    }

    return (
      <div className="animate-fade-in">
        <AccessRestrictedPage
          connectedDomains={connectedDomains}
          userName={userName}
          userEmail={userEmail}
          totalPartnerCount={totalPartnerCount}
        />
      </div>
    );
  }

  // ── Scanning phase ────────────────────────────────────────────────────────
  return (
    <ScanningScreen
      connectedDomains={connectedDomains}
      scanPhaseIndex={scanPhaseIndex}
      fadeOut={fadeOut}
    />
  );
}
