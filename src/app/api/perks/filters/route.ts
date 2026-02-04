import { NextResponse } from 'next/server';
import { createClientFromProvider, createPerksService } from '@/lib/api';
import { createSupabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * GET /api/perks/filters
 * Get available filter options derived from API data
 *
 * Returns unique values for:
 * - offer_categories: Array of category names
 * - investment_levels: Array of investment level names
 *
 * Filter values are extracted dynamically from actual offer data.
 * DO NOT hardcode filter options.
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

  const filters = await perksService.getFilterOptions();

  const response = NextResponse.json({
    ...filters,
    _debug: {
      provider: provider.slug,
      timestamp: new Date().toISOString(),
    },
  });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}
