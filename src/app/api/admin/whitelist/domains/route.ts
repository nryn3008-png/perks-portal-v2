import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthWithAccounts, isProviderOwner } from '@/lib/bridge/auth';
import { createClientFromProvider } from '@/lib/api';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * GET /api/admin/whitelist/domains
 * Fetch paginated list of whitelisted domains from GetProven API
 * ADMIN or PROVIDER OWNER only
 *
 * Query params:
 * - page: Page number (default 1)
 * - page_size: Items per page (default 50, max 1000)
 *
 * Response includes `isOwner` flag for provider-level access control on frontend.
 */
export async function GET(request: NextRequest) {
  // Resolve user with connected accounts for provider owner check
  const { authenticated, user } = await resolveAuthWithAccounts();
  if (!authenticated || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  // Check access: must be admin OR provider community owner
  const connectedEmails = user.connectedAccounts.map((a) => a.email);
  const isOwner = isProviderOwner(user.email, connectedEmails, provider.owner_email);

  if (!user.isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = createClientFromProvider(provider);

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('page_size') || '50'), 1000);

  try {
    const data = await client.getWhitelistDomains(page, pageSize);

    const response = NextResponse.json({
      data: data.results,
      pagination: {
        count: data.count,
        next: data.next,
        previous: data.previous,
      },
      isOwner,
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (err) {
    logger.error('[Whitelist Domains] Failed to fetch:', err);
    const errorResponse = NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Unable to load whitelisted domains', status: 500 } },
      { status: 500 }
    );
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return errorResponse;
  }
}
