import { NextResponse } from 'next/server';
import { vendorsService } from '@/lib/api';

/**
 * GET /api/vendors/filters
 * Fetch available filter options for vendors
 * Returns unique services and vendor groups from API data
 */
export async function GET() {
  const filters = await vendorsService.getFilterOptions();
  return NextResponse.json(filters);
}
