import { NextRequest, NextResponse } from 'next/server';
import { createClientFromProvider, createPerksService } from '@/lib/api';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { checkApiAccess } from '@/lib/api/check-api-access';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * GET /api/perks
 * Fetch paginated list of offers from GetProven API
 *
 * Query params:
 * - page: Page number (default 1)
 * - page_size: Items per page (default 24, max 1000)
 * - offer_categories: Comma-separated category names
 * - investment_levels: Comma-separated investment level names
 * - next: API-provided next URL for pagination
 */
export async function GET(request: NextRequest) {
  // Domain-based access check
  const denied = checkApiAccess(request);
  if (denied) return denied;

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

  const searchParams = request.nextUrl.searchParams;

  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('page_size') || '24'), 1000);
  const offerCategories = searchParams.get('offer_categories') || undefined;
  const investmentLevels = searchParams.get('investment_levels') || undefined;
  const nextUrl = searchParams.get('next') || undefined;

  const result = await perksService.getOffers(page, pageSize, {
    offerCategories,
    investmentLevels,
  }, nextUrl);

  if (!result.success) {
    const errorResponse = NextResponse.json(
      { error: result.error },
      { status: result.error.status }
    );
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return errorResponse;
  }

  const response = NextResponse.json(result.data);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}
