import { NextRequest, NextResponse } from 'next/server';
import { createClientFromProvider, createVendorsService } from '@/lib/api';
import { createSupabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * GET /api/vendors/[id]/clients
 * Fetch vendor clients from GetProven API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const result = await vendorsService.getVendorClients(id);

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
