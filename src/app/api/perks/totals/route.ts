import { NextResponse } from 'next/server';
import { perksService } from '@/lib/api';

/**
 * GET /api/perks/totals
 * Returns total offers count and total savings value
 *
 * Response:
 * - totalOffers: number (from API count)
 * - totalSavings: string (formatted, e.g., "$8.1M", "$250K")
 * - totalSavingsRaw: number (raw sum for calculations)
 */
export async function GET() {
  const stats = await perksService.getDashboardStats();

  return NextResponse.json({
    totalOffers: stats.totalPerks,
    totalSavings: stats.totalValue,
  });
}
