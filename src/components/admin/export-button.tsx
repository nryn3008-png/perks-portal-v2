'use client';

import { Download } from 'lucide-react';

interface RedemptionRow {
  clicked_at: string;
  user_email: string;
  offer_name: string;
  vendor_name: string;
  estimated_value: number | null;
}

interface ExportButtonProps {
  data: RedemptionRow[];
  disabled?: boolean;
}

export function ExportButton({ data, disabled }: ExportButtonProps) {
  const handleExport = () => {
    if (data.length === 0) return;

    const headers = ['Date', 'User Email', 'Perk', 'Vendor', 'Estimated Value'];
    const rows = data.map((row) => [
      new Date(row.clicked_at).toLocaleString(),
      row.user_email || '',
      row.offer_name || '',
      row.vendor_name || '',
      row.estimated_value != null ? `$${Number(row.estimated_value).toLocaleString()}` : '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `redemption-clicks-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || data.length === 0}
      className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 transition-all duration-150 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className="h-3.5 w-3.5" />
      Export CSV
    </button>
  );
}
