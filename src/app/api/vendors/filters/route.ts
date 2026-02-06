import { NextResponse } from 'next/server';
import { createClientFromProvider, createVendorsService } from '@/lib/api';
import { createSupabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * GET /api/vendors/filters
 * Fetch available filter options for vendors
 * Returns unique services and vendor groups from API data
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
  const vendorsService = createVendorsService(client, provider.api_token);

  const filters = await vendorsService.getFilterOptions();

  const response = NextResponse.json(filters);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}
