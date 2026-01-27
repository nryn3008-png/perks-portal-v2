'use client';

/**
 * API Status Chip - MercuryOS Design System
 *
 * Displays GetProven API health status in a compact chip.
 * - Visible to all users
 * - Diagnostic details only for admin users
 * - No animations, toasts, or blocking behavior
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface HealthCheck {
  endpoint: string;
  status: 'ok' | 'error';
  critical: boolean;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  checks: HealthCheck[];
  timestamp: string;
}

interface ApiStatusChipProps {
  isAdmin?: boolean;
}

// Cache health results for 30 seconds
const CACHE_DURATION = 30000;
let cachedResult: { data: HealthResponse; timestamp: number } | null = null;

export function ApiStatusChip({ isAdmin = false }: ApiStatusChipProps) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [showPopover, setShowPopover] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const chipRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchHealth = useCallback(async () => {
    // Check cache first
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      setHealth(cachedResult.data);
      setIsLoading(false);
      return;
    }

    try {
      const url = isAdmin ? '/api/health?admin=true' : '/api/health';
      const response = await fetch(url);
      if (response.ok) {
        const data: HealthResponse = await response.json();
        cachedResult = { data, timestamp: Date.now() };
        setHealth(data);
      }
    } catch {
      // Silently fail - don't block UI
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchHealth();

    // Refresh health check every 60 seconds
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        chipRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !chipRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false);
      }
    }

    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPopover]);

  // Show subtle loading state
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-400">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
        Checking...
      </span>
    );
  }

  // Don't render if no health data (failed to fetch)
  if (!health) {
    return null;
  }

  const statusConfig = {
    healthy: {
      label: 'API OK',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-700',
      dotClass: 'bg-emerald-500',
    },
    degraded: {
      label: 'API Issues',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-700',
      dotClass: 'bg-amber-500',
    },
    down: {
      label: 'API Down',
      bgClass: 'bg-red-50',
      textClass: 'text-red-700',
      dotClass: 'bg-red-500',
    },
  };

  const config = statusConfig[health.status];

  // Format endpoint for display (admin only)
  const formatEndpoint = (endpoint: string): string => {
    if (endpoint.includes('/offers/')) return 'Offers API';
    if (endpoint.includes('/vendors/')) return 'Vendors API';
    if (endpoint.includes('/whitelist/')) return 'Whitelist API';
    return 'Unknown';
  };

  return (
    <div className="relative">
      <button
        ref={chipRef}
        onClick={() => setShowPopover(!showPopover)}
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-1',
          config.bgClass,
          config.textClass
        )}
        aria-label={`API Status: ${config.label}`}
      >
        <span
          className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)}
          aria-hidden="true"
        />
        {config.label}
      </button>

      {/* Popover - opens upward since chip is at bottom of sidebar */}
      {showPopover && (
        <div
          ref={popoverRef}
          className="absolute right-0 bottom-full z-50 mb-2 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-lg"
          role="tooltip"
        >
          {isAdmin ? (
            // Admin view: show diagnostic details
            <>
              <div className="border-b border-gray-100 px-3 pb-2 mb-2">
                <p className="text-xs font-medium text-gray-500">API Health Status</p>
              </div>
              <div className="space-y-1 px-3">
                {health.checks.map((check) => (
                  <div
                    key={check.endpoint}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-gray-600">
                      {formatEndpoint(check.endpoint)}
                      {check.critical && (
                        <span className="ml-1 text-gray-400">(critical)</span>
                      )}
                    </span>
                    <span
                      className={cn(
                        'font-medium',
                        check.status === 'ok' ? 'text-emerald-600' : 'text-red-600'
                      )}
                    >
                      {check.status === 'ok' ? 'OK' : 'Error'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 mt-2 pt-2 px-3">
                <p className="text-xs text-gray-400">
                  Last checked: {new Date(health.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </>
          ) : (
            // Non-admin view: generic message
            <div className="px-3 py-1">
              <p className="text-xs text-gray-600">System status</p>
              <p className={cn('text-sm font-medium mt-1', config.textClass)}>
                {health.status === 'healthy'
                  ? 'All systems operational'
                  : health.status === 'degraded'
                  ? 'Some features may be limited'
                  : 'Service disruption detected'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
