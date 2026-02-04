import { NextResponse } from 'next/server';
import { getDefaultProvider } from '@/lib/providers';
import { createClientFromProvider, createVendorsService } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * GET /api/vendors/filters
 * Fetch available filter options for vendors
 * Returns unique services and vendor groups from API data
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
  const vendorsService = createVendorsService(client, provider.api_token);

  const filters = await vendorsService.getFilterOptions();
  return NextResponse.json(filters);
}
