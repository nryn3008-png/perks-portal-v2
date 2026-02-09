'use client';

/**
 * Access Gate — Domain Scanning Animation
 *
 * Shows a conveyor-belt scanning animation: VC favicons slide into a
 * pulsating scan circle (full color, bigger), then slide out as
 * grayscale and smaller. 3 logos visible at a time.
 *
 * Runs for 8 seconds minimum before revealing the result.
 *
 * Design: MercuryOS — Bridge Blue #0038FF, Mulish, rounded-xl
 */

import { useState, useEffect, useCallback } from 'react';
import { Shield, ShieldCheck, Building2, CheckCircle2 } from 'lucide-react';
import { AccessRestrictedPage } from '@/components/access-restricted';
import { FEATURED_VCS } from '@/lib/constants/featured-vcs';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface AccessGateProps {
  accessGranted: boolean;
  /** The user's email domain that actually matched the whitelist */
  matchedDomain?: string;
  /** Whether the scanning animation has already been shown for this access check */
  animationShown?: boolean;
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
  'Matching against partner network...',
  'Checking portfolio access...',
  'Cross-referencing credentials...',
  'Verifying access level...',
  'Finalizing verification...',
  'Almost there...',
];

const PHASE_DURATION = 1000;
const TOTAL_DURATION = 8000;
const FADE_OUT_OFFSET = 800;
const GRANTED_DURATION = 2500;
const GRANTED_FADE_OFFSET = 500;

// VCs for the scanning conveyor
const SCAN_VCS = FEATURED_VCS.slice(0, 12);
const SCAN_INTERVAL = 1200; // ms between each VC scan

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN CHIP
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
        border transition-all duration-300 animate-fade-in-up
        ${
          isActive
            ? 'bg-[#0038FF]/5 border-[#0038FF]/30 shadow-sm shadow-[#0038FF]/10'
            : 'bg-white border-gray-200'
        }
      `}
      style={{ animationDelay: `${(index + 1) * 100}ms` }}
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
      {isActive && (
        <span className="h-1.5 w-1.5 rounded-full bg-[#0038FF] animate-pulse" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCANNER CONVEYOR
// ─────────────────────────────────────────────────────────────────────────────

function ScannerConveyor({ currentIndex }: { currentIndex: number }) {
  // 3 slots: entering (left), scanning (center), exiting (right)
  const prevIndex = (currentIndex - 1 + SCAN_VCS.length) % SCAN_VCS.length;
  const nextIndex = (currentIndex + 1) % SCAN_VCS.length;

  const enteringVC = SCAN_VCS[nextIndex];
  const scanningVC = SCAN_VCS[currentIndex];
  const exitingVC = SCAN_VCS[prevIndex];

  return (
    <div className="relative flex items-center justify-center mx-auto" style={{ height: 100 }}>
      <div className="flex items-center gap-16">

        {/* LEFT — entering: sliding in, semi-transparent */}
        <div
          key={`entering-${enteringVC.domain}`}
          className="flex flex-col items-center gap-1.5 animate-slide-in-left"
          style={{ width: 56 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://www.google.com/s2/favicons?domain=${enteringVC.domain}&sz=64`}
            alt={enteringVC.name}
            className="h-8 w-8 object-contain"
          />
          <span className="text-[10px] text-gray-400 font-medium max-w-[56px] truncate text-center">
            {enteringVC.name}
          </span>
        </div>

        {/* CENTER — scanning: inside the tight pulsating circle */}
        <div className="flex flex-col items-center gap-2" style={{ width: 64 }}>
          {/* Favicon wrapper — rings are relative to this */}
          <div
            key={`scanning-${scanningVC.domain}`}
            className="relative flex items-center justify-center h-9 w-9 animate-slide-into-scan"
          >
            {/* Pulsating rings — centered on the favicon */}
            <div className="absolute inset-0 m-auto h-12 w-12 rounded-full border-[1.5px] border-[#0038FF]/40 animate-scan-pulse-ring" style={{ top: '-6px', left: '-6px', right: '-6px', bottom: '-6px' }} />
            <div className="absolute inset-0 m-auto h-12 w-12 rounded-full border-[1.5px] border-[#0038FF]/20 animate-scan-pulse-ring" style={{ top: '-6px', left: '-6px', right: '-6px', bottom: '-6px', animationDelay: '0.6s' }} />

            {/* Soft glow disc */}
            <div className="absolute inset-[-4px] rounded-full bg-[#0038FF]/[0.04] animate-scan-glow" />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://www.google.com/s2/favicons?domain=${scanningVC.domain}&sz=64`}
              alt={scanningVC.name}
              className="relative z-10 h-9 w-9 object-contain"
            />
          </div>
          <span className="text-[10px] text-[#0038FF] font-semibold max-w-[64px] truncate text-center">
            {scanningVC.name}
          </span>
        </div>

        {/* RIGHT — exiting: grayscale, slightly smaller */}
        <div
          key={`exiting-${exitingVC.domain}`}
          className="flex flex-col items-center gap-1.5"
          style={{ width: 56 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://www.google.com/s2/favicons?domain=${exitingVC.domain}&sz=64`}
            alt={exitingVC.name}
            className="h-6 w-6 object-contain opacity-30 grayscale"
          />
          <span className="text-[10px] text-gray-300 font-medium max-w-[56px] truncate text-center">
            {exitingVC.name}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCESS GRANTED SCREEN
// ─────────────────────────────────────────────────────────────────────────────

function AccessGrantedScreen({
  matchedDomain,
  userName,
  fadeOut,
}: {
  matchedDomain?: string;
  userName: string;
  fadeOut: boolean;
}) {
  return (
    <div
      className={`
        min-h-[60vh] flex items-center justify-center px-4
        transition-opacity duration-500 ease-in-out
        ${fadeOut ? 'opacity-0' : 'opacity-100'}
      `}
    >
      <div className="w-full max-w-md text-center space-y-6 animate-fade-in-up">

        {/* ── Success Icon ──────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-2 shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Access Granted
          </h1>
          <p className="text-[13px] text-gray-500">
            {userName ? `Welcome, ${userName}!` : 'Welcome!'} Your identity has been verified
          </p>
        </div>

        {/* ── Matched Domain ────────────────────────────────────── */}
        {matchedDomain && (
          <div className="space-y-2">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
              Verified through
            </p>
            <div className="flex justify-center">
              <div
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 bg-emerald-50 border border-emerald-200 animate-fade-in-up"
                style={{ animationDelay: '100ms' }}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${matchedDomain}&sz=64`}
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
                <Building2 className="hidden h-4 w-4 text-emerald-400" />
                <span className="text-[14px] font-semibold text-emerald-800">
                  {matchedDomain}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Loading indicator ─────────────────────────────────── */}
        <p className="text-[12px] text-gray-400 animate-fade-in" style={{ animationDelay: '400ms' }}>
          Loading your perks...
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCANNING SCREEN
// ─────────────────────────────────────────────────────────────────────────────

function ScanningScreen({
  connectedDomains,
  scanPhaseIndex,
  fadeOut,
  vcScanIndex,
}: {
  connectedDomains: string[];
  scanPhaseIndex: number;
  fadeOut: boolean;
  vcScanIndex: number;
}) {
  const activeDomainIndex = scanPhaseIndex >= 2 && scanPhaseIndex <= 5
    ? (scanPhaseIndex - 2) % connectedDomains.length
    : -1;

  return (
    <div
      className={`
        min-h-[60vh] flex items-center justify-center px-4
        transition-opacity duration-700 ease-in-out
        ${fadeOut ? 'opacity-0' : 'opacity-100'}
      `}
    >
      <div className="w-full max-w-md text-center space-y-6">

        {/* ── Title ──────────────────────────────────────────────── */}
        <div className="space-y-2 animate-fade-in">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0038FF] to-[#0030E0] mb-3 animate-scan-glow">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Verifying Access
          </h1>
          <p className="text-[13px] text-gray-500">
            Scanning your domain against our partner network
          </p>
        </div>

        {/* ── Scanner Conveyor ────────────────────────────────────── */}
        <ScannerConveyor currentIndex={vcScanIndex} />

        {/* ── Your Domains Being Checked ─────────────────────────── */}
        {connectedDomains.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider animate-fade-in">
              Work emails connected to your account
            </p>
            <div className="relative rounded-xl border border-gray-200 bg-gray-50/50 p-4 overflow-hidden">
              <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none z-10">
                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#0038FF]/40 to-transparent animate-scan-line" />
              </div>
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
          </div>
        )}

        {/* ── Status Text ────────────────────────────────────────── */}
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
  matchedDomain,
  animationShown,
  connectedDomains,
  userName,
  userEmail,
  totalPartnerCount,
  children,
}: AccessGateProps) {
  const [phase, setPhase] = useState<'scanning' | 'granted' | 'result'>('scanning');
  const [scanPhaseIndex, setScanPhaseIndex] = useState(0);
  const [vcScanIndex, setVcScanIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  // Skip animation if:
  // 1. No work domains to scan (personal email only)
  // 2. Animation already shown for this access check (page reload)
  // 3. User prefers reduced motion
  const shouldSkip = useCallback(() => {
    if (connectedDomains.length === 0) return true;
    if (animationShown) return true;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }
    return false;
  }, [connectedDomains.length, animationShown]);

  // ── Scanning → granted/result timer ─────────────────────────────────────
  useEffect(() => {
    if (shouldSkip()) {
      setPhase('result');
      return;
    }

    // Mark animation as shown in the access cookie so page reloads skip it
    fetch('/api/access/animation-shown', { method: 'POST' }).catch(() => {});

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase text transitions
    for (let i = 1; i < SCAN_PHASES.length; i++) {
      timers.push(
        setTimeout(() => setScanPhaseIndex(i), i * PHASE_DURATION)
      );
    }

    // VC conveyor — cycle through logos
    const vcInterval = setInterval(() => {
      setVcScanIndex((prev) => (prev + 1) % SCAN_VCS.length);
    }, SCAN_INTERVAL);

    // Fade out scanning screen
    timers.push(
      setTimeout(() => setFadeOut(true), TOTAL_DURATION - FADE_OUT_OFFSET)
    );

    // After scanning: show granted screen or go directly to result
    timers.push(
      setTimeout(() => {
        if (accessGranted) {
          setPhase('granted');
          setFadeOut(false);
        } else {
          setPhase('result');
        }
      }, TOTAL_DURATION)
    );

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(vcInterval);
    };
  }, [shouldSkip, accessGranted]);

  // ── Granted → result timer ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'granted') return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Fade out granted screen
    timers.push(
      setTimeout(() => setFadeOut(true), GRANTED_DURATION - GRANTED_FADE_OFFSET)
    );

    // Switch to result (show perks)
    timers.push(
      setTimeout(() => setPhase('result'), GRANTED_DURATION)
    );

    return () => timers.forEach(clearTimeout);
  }, [phase]);

  // ── Result phase ──────────────────────────────────────────────────────────
  if (phase === 'result') {
    if (accessGranted) {
      return <div className="animate-fade-in-up">{children}</div>;
    }

    return (
      <div className="animate-fade-in-up">
        <AccessRestrictedPage
          connectedDomains={connectedDomains}
          userName={userName}
          userEmail={userEmail}
          totalPartnerCount={totalPartnerCount}
        />
      </div>
    );
  }

  // ── Granted phase ───────────────────────────────────────────────────────
  if (phase === 'granted') {
    return (
      <AccessGrantedScreen
        matchedDomain={matchedDomain}
        userName={userName}
        fadeOut={fadeOut}
      />
    );
  }

  // ── Scanning phase ────────────────────────────────────────────────────────
  return (
    <ScanningScreen
      connectedDomains={connectedDomains}
      scanPhaseIndex={scanPhaseIndex}
      fadeOut={fadeOut}
      vcScanIndex={vcScanIndex}
    />
  );
}
