'use client';

/**
 * API Health Badge component - MercuryOS Design System
 * Shows the current health status of the GetProven API
 */

import { useEffect, useState } from 'react';

type HealthStatus = 'healthy' | 'degraded' | 'down' | 'checking';

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
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

export function ApiHealthBadge() {
  const [status, setStatus] = useState<HealthStatus>('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (!res.ok) {
          setStatus('down');
          return;
        }
        const data: HealthResponse = await res.json();
        setStatus(data.status);
      } catch {
        setStatus('down');
      }
    };

    // Initial check
    checkHealth();

    // Poll every 60 seconds
    const interval = setInterval(checkHealth, 60000);

    return () => clearInterval(interval);
  }, []);

  const config = statusConfig[status];

  return (
    <div
      className="hidden sm:flex items-center gap-1.5 text-[11px]"
      role="status"
      aria-live="polite"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dotClass} ${status === 'checking' ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      <span className={`font-medium ${config.textClass}`}>
        {config.label}
      </span>
    </div>
  );
}
