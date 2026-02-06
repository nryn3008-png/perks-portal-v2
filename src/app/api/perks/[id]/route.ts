import { NextRequest, NextResponse } from 'next/server';
import { createClientFromProvider, createPerksService } from '@/lib/api';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { checkApiAccess } from '@/lib/api/check-api-access';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * GET /api/perks/[id]
 * Fetch single offer by ID from GetProven API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const result = await perksService.getOfferById(id);

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

// FUTURE: PATCH for updating perk visibility/settings (admin only)
// FUTURE: DELETE for removing custom perks (admin only)
