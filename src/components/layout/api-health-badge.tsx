'use client';

/**
 * API Health Badge component - MercuryOS Design System
 * Shows the current health status of GetProven and Bridge APIs with tooltip details
 */

import { useEffect, useState, useRef } from 'react';

type HealthStatus = 'healthy' | 'degraded' | 'down' | 'checking';

interface ApiStatus {
  name: string;
  status: 'ok' | 'error' | 'unconfigured';
  latency?: number;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  apis: {
    getproven: ApiStatus;
    bridge: ApiStatus;
  };
}

const statusConfig: Record<HealthStatus, { label: string; dotClass: string; textClass: string }> = {
  healthy: {
    label: 'API Online',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-600',
  },
  degraded: {
    label: 'API Degraded',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-600',
  },
  down: {
    label: 'API Offline',
    dotClass: 'bg-red-500',
    textClass: 'text-red-600',
  },
  checking: {
    label: 'Checking...',
    dotClass: 'bg-gray-400',
    textClass: 'text-gray-500',
  },
};

const apiStatusConfig: Record<'ok' | 'error' | 'unconfigured', { label: string; dotClass: string; textClass: string }> = {
  ok: {
    label: 'Online',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-600',
  },
  error: {
    label: 'Offline',
    dotClass: 'bg-red-500',
    textClass: 'text-red-600',
  },
  unconfigured: {
    label: 'Not Configured',
    dotClass: 'bg-gray-400',
    textClass: 'text-gray-500',
  },
};

export function ApiHealthBadge() {
  const [status, setStatus] = useState<HealthStatus>('checking');
  const [apiDetails, setApiDetails] = useState<HealthResponse['apis'] | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (!res.ok) {
          setStatus('down');
          setApiDetails(null);
          return;
        }
        const data: HealthResponse = await res.json();
        setStatus(data.status);
        setApiDetails(data.apis);
        setLastChecked(new Date().toLocaleTimeString());
      } catch {
        setStatus('down');
        setApiDetails(null);
      }
    };

    // Initial check
    checkHealth();

    // Poll every 60 seconds
    const interval = setInterval(checkHealth, 60000);

    return () => clearInterval(interval);
  }, []);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  const config = statusConfig[status];

  const formatLatency = (latency?: number) => {
    if (latency === undefined) return '';
    return `${latency}ms`;
  };

  return (
    <div className="relative" ref={tooltipRef}>
      <button
        className="hidden sm:flex items-center gap-1 text-[12px] hover:opacity-80 transition-opacity cursor-pointer"
        role="status"
        aria-live="polite"
        aria-haspopup="true"
        aria-expanded={showTooltip}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${config.dotClass} ${status === 'checking' ? 'animate-pulse' : ''}`}
          aria-hidden="true"
        />
        <span className={`font-medium ${config.textClass}`}>
          {config.label}
        </span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute top-full right-0 mt-2 z-50 w-64 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg shadow-black/10 border border-gray-200/60 overflow-hidden"
          role="tooltip"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-200/60">
            <h3 className="text-xs font-semibold text-gray-900">API Health Status</h3>
            {lastChecked && (
              <p className="text-[12px] text-gray-500 mt-0.5">Last checked: {lastChecked}</p>
            )}
          </div>

          {/* API Status List */}
          <div className="p-4 space-y-2">
            {apiDetails ? (
              <>
                {/* GetProven API */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${apiStatusConfig[apiDetails.getproven.status].dotClass}`}
                    />
                    <span className="text-xs font-medium text-gray-700">GetProven</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {apiDetails.getproven.latency !== undefined && (
                      <span className="text-[12px] text-gray-500">
                        {formatLatency(apiDetails.getproven.latency)}
                      </span>
                    )}
                    <span className={`text-[12px] font-medium ${apiStatusConfig[apiDetails.getproven.status].textClass}`}>
                      {apiStatusConfig[apiDetails.getproven.status].label}
                    </span>
                  </div>
                </div>

                {/* Bridge API */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${apiStatusConfig[apiDetails.bridge.status].dotClass}`}
                    />
                    <span className="text-xs font-medium text-gray-700">Bridge</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {apiDetails.bridge.latency !== undefined && (
                      <span className="text-[12px] text-gray-500">
                        {formatLatency(apiDetails.bridge.latency)}
                      </span>
                    )}
                    <span className={`text-[12px] font-medium ${apiStatusConfig[apiDetails.bridge.status].textClass}`}>
                      {apiStatusConfig[apiDetails.bridge.status].label}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-2">
                <span className="text-xs text-gray-500">
                  {status === 'checking' ? 'Checking APIs...' : 'Unable to fetch status'}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-200/60">
            <p className="text-[12px] text-gray-500 text-center">
              Hover or tap for details
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
