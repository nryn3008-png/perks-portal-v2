'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

// Muted professional palette
const COLORS = {
  primary: '#0038FF',
  primaryLight: 'rgba(0, 56, 255, 0.15)',
  secondary: '#6366f1',
  secondaryLight: 'rgba(99, 102, 241, 0.15)',
  green: '#10b981',
  greenLight: 'rgba(16, 185, 129, 0.15)',
};

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <BarChart3 className="h-8 w-8 mb-2" />
      <p className="text-sm">No data yet</p>
    </div>
  );
}

// Custom tooltip
function CustomTooltip({ active, payload, label, valuePrefix = '', valueSuffix = '' }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900">
        {valuePrefix}{payload[0].value.toLocaleString()}{valueSuffix}
      </p>
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDollar(val: number) {
  if (val >= 1000) return `$${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}K`;
  return `$${val}`;
}

// --- Chart Components ---

interface TimeSeriesProps {
  data: { date: string; clicks: number; value: number }[];
}

export function RedemptionsOverTimeChart({ data }: TimeSeriesProps) {
  if (data.length === 0) return <ChartCard title="Redemptions Over Time"><EmptyChart /></ChartCard>;
  return (
    <ChartCard title="Redemptions Over Time" subtitle="Daily click activity">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.2} />
              <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip valueSuffix=" clicks" />} />
          <Area type="monotone" dataKey="clicks" stroke={COLORS.primary} strokeWidth={2} fill="url(#clicksGradient)" animationDuration={800} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface TopItemsProps {
  data: { name: string; count: number }[];
}

export function TopPerksChart({ data }: TopItemsProps) {
  if (data.length === 0) return <ChartCard title="Top 10 Perks"><EmptyChart /></ChartCard>;
  const chartData = data.map((d) => ({
    ...d,
    shortName: d.name.length > 28 ? d.name.slice(0, 28) + '...' : d.name,
  }));
  return (
    <ChartCard title="Top 10 Perks" subtitle="Ranked by total clicks">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="shortName" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={160} />
          <Tooltip content={<CustomTooltip valueSuffix=" clicks" />} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} animationDuration={800}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS.primary} fillOpacity={1 - i * 0.07} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TopVendorsChart({ data }: TopItemsProps) {
  if (data.length === 0) return <ChartCard title="Top Vendors"><EmptyChart /></ChartCard>;
  const chartData = data.map((d) => ({
    ...d,
    shortName: d.name.length > 28 ? d.name.slice(0, 28) + '...' : d.name,
  }));
  return (
    <ChartCard title="Top Vendors" subtitle="Grouped by vendor">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="shortName" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={160} />
          <Tooltip content={<CustomTooltip valueSuffix=" clicks" />} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} animationDuration={800}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS.secondary} fillOpacity={1 - i * 0.07} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface CumulativeValueProps {
  data: { date: string; value: number }[];
}

export function ValueOverTimeChart({ data }: CumulativeValueProps) {
  if (data.length === 0) return <ChartCard title="Value Delivered"><EmptyChart /></ChartCard>;
  return (
    <ChartCard title="Value Delivered" subtitle="Cumulative estimated value over time">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.2} />
              <stop offset="100%" stopColor={COLORS.green} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatDollar} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip valuePrefix="$" />} />
          <Area type="monotone" dataKey="value" stroke={COLORS.green} strokeWidth={2} fill="url(#valueGradient)" animationDuration={800} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Skeletons
export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse">
      <div className="h-5 w-40 rounded bg-gray-200 mb-1" />
      <div className="h-4 w-28 rounded bg-gray-200 mb-4" />
      <div className="h-[260px] rounded bg-gray-100" />
    </div>
  );
}
