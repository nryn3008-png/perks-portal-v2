'use client';

import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
}

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {trend && (
        <p className={`text-sm font-medium mt-2 ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-4 w-4 rounded bg-gray-200" />
        <div className="h-4 w-20 rounded bg-gray-200" />
      </div>
      <div className="h-9 w-24 rounded bg-gray-200 mt-1" />
    </div>
  );
}
