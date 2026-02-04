import { NextResponse } from 'next/server';
import { getDefaultProvider } from '@/lib/providers';
import { createClientFromProvider, createPerksService } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

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
  const provider = await getDefaultProvider();
  if (!provider) {
    return NextResponse.json(
      { error: { code: 'PROVIDER_ERROR', message: 'No active provider configured', status: 500 } },
      { status: 500 }
    );
  }

  const client = createClientFromProvider(provider);
  const perksService = createPerksService(client, provider.api_token);

  const stats = await perksService.getDashboardStats();

  return NextResponse.json({
    totalOffers: stats.totalPerks,
    totalSavings: stats.totalValue,
  });
}
