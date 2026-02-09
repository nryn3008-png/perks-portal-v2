'use client';

/**
 * Access Badge — compact access status indicator for the top nav.
 * Fetches from /api/access/status on mount and displays a color-coded pill.
 */

import { useEffect, useState } from 'react';
import { ShieldCheck, Crown, Briefcase, Network, UserCheck } from 'lucide-react';

interface AccessData {
  granted: boolean;
  reason: string;
  matchedDomain?: string;
}

const BADGE_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  classes: string;
}> = {
  admin: {
    label: 'Admin',
    icon: Crown,
    classes: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  vc_team: {
    label: 'VC Team',
    icon: Briefcase,
    classes: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  portfolio_match: {
    label: 'Portfolio',
    icon: Network,
    classes: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  manual_grant: {
    label: 'Approved',
    icon: UserCheck,
    classes: 'text-purple-700 bg-purple-50 border-purple-200',
  },
};

export function AccessBadge() {
  const [access, setAccess] = useState<AccessData | null>(null);

  useEffect(() => {
    fetch('/api/access/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.granted && data.reason) {
          setAccess(data);
        }
      })
      .catch(() => {});
  }, []);

  if (!access || !BADGE_CONFIG[access.reason]) return null;

  const config = BADGE_CONFIG[access.reason];
  const Icon = config.icon;

  return (
    <div
      className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${config.classes}`}
      title={access.matchedDomain ? `Access via ${access.matchedDomain}` : config.label}
    >
      <ShieldCheck className="h-3 w-3" />
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  );
}
