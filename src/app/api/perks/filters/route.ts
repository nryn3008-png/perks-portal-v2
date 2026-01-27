import { NextResponse } from 'next/server';
import { perksService } from '@/lib/api';

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
  const filters = await perksService.getFilterOptions();
  return NextResponse.json(filters);
}
