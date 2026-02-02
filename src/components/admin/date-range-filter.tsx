'use client';

const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'all', label: 'All time' },
] as const;

export type DateRange = (typeof RANGES)[number]['value'];

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex items-center rounded-full border border-gray-200 bg-gray-50 p-0.5">
      {RANGES.map((range) => (
        <button
          key={range.value}
          type="button"
          onClick={() => onChange(range.value)}
          className={`rounded-full px-3 py-1 text-[13px] font-medium transition-all duration-150 ${
            value === range.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
