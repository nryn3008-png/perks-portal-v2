import { NextResponse } from 'next/server';
import { getDefaultProvider } from '@/lib/providers';
import { createClientFromProvider, createPerksService } from '@/lib/api';

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
  const provider = await getDefaultProvider();
  if (!provider) {
    return NextResponse.json(
      { error: { code: 'PROVIDER_ERROR', message: 'No active provider configured', status: 500 } },
      { status: 500 }
    );
  }

  const client = createClientFromProvider(provider);
  const perksService = createPerksService(client, provider.api_token);

  const filters = await perksService.getFilterOptions();
  return NextResponse.json(filters);
}
