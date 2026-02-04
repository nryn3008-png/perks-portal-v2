import { NextRequest, NextResponse } from 'next/server';
import { createClientFromProvider, createVendorsService } from '@/lib/api';
import { createSupabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * GET /api/vendors
 * Fetch vendors from GetProven API
 *
 * Query params:
 * - page: Page number (default: 1)
 * - page_size: Items per page (default: 24, max: 1000)
 * - search: Search by vendor name
 * - service_name: Filter by service name
 * - group_name: Filter by vendor group name
 * - next: API-provided next URL for pagination
 */
export async function GET(request: NextRequest) {
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

  const searchParams = request.nextUrl.searchParams;

  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('page_size') || '24'), 1000);
  const search = searchParams.get('search') || undefined;
  const serviceName = searchParams.get('service_name') || undefined;
  const groupName = searchParams.get('group_name') || undefined;
  const nextUrl = searchParams.get('next') || undefined;

  const result = await vendorsService.getVendors(
    page,
    pageSize,
    { search, serviceName, groupName },
    nextUrl
  );

  if (!result.success) {
    const errorResponse = NextResponse.json(
      { error: result.error },
      { status: result.error.status }
    );
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return errorResponse;
  }

  const response = NextResponse.json({
    ...result.data,
    _debug: {
      provider: provider.slug,
      api_url: provider.api_url,
      timestamp: new Date().toISOString(),
    },
  });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}
