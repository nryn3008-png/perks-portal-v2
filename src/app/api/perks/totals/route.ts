import { NextResponse } from 'next/server';
import { createClientFromProvider, createPerksService } from '@/lib/api';
import { createSupabaseAdmin } from '@/lib/supabase-server';

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
  // Create fresh Supabase client to avoid any caching
  const supabase = createSupabaseAdmin();

  // Get default provider directly
  const { data: provider, error } = await supabase
    .from('providers')
    .select('*')
    .eq('is_default', true)
    .eq('is_active', true)
    .single();

  if (error || !provider) {
    return NextResponse.json(
      { error: { code: 'PROVIDER_ERROR', message: 'No active provider configured', status: 500 } },
      { status: 500 }
    );
  }

  const client = createClientFromProvider(provider);
  const perksService = createPerksService(client, provider.api_token);

  const stats = await perksService.getDashboardStats();

  const response = NextResponse.json({
    totalOffers: stats.totalPerks,
    totalSavings: stats.totalValue,
    _debug: {
      provider: provider.slug,
      timestamp: new Date().toISOString(),
    },
  });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}
