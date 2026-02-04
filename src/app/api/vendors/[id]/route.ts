import { NextRequest, NextResponse } from 'next/server';
import { getDefaultProvider } from '@/lib/providers';
import { createClientFromProvider, createVendorsService } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * GET /api/vendors/[id]
 * Fetch single vendor by ID from GetProven API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const provider = await getDefaultProvider();
  if (!provider) {
    return NextResponse.json(
      { error: { code: 'PROVIDER_ERROR', message: 'No active provider configured', status: 500 } },
      { status: 500 }
    );
  }

  const client = createClientFromProvider(provider);
  const vendorsService = createVendorsService(client, provider.api_token);

  const { id } = await params;
  const result = await vendorsService.getVendorById(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error.status }
    );
  }

  return NextResponse.json(result.data);
}
