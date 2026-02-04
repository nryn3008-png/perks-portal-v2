import { NextRequest, NextResponse } from 'next/server';
import { createClientFromProvider } from '@/lib/api';
import { createSupabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * GET /api/admin/whitelist/individual-access
 * Fetch paginated list of individually whitelisted users from GetProven API
 * ADMIN ONLY
 *
 * Query params:
 * - page: Page number (default 1)
 * - page_size: Items per page (default 50, max 1000)
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

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('page_size') || '50'), 1000);

  try {
    const data = await client.getIndividualAccess(page, pageSize);

    const response = NextResponse.json({
      data: data.results,
      pagination: {
        count: data.count,
        next: data.next,
        previous: data.previous,
      },
      _debug: {
        provider: provider.slug,
        api_url: provider.api_url,
        timestamp: new Date().toISOString(),
      },
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (err) {
    console.error('[Individual Access] Failed to fetch:', err);
    const errorResponse = NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Unable to load individual access list', status: 500 } },
      { status: 500 }
    );
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return errorResponse;
  }
}
