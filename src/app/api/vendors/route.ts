import { NextRequest, NextResponse } from 'next/server';
import { getDefaultProvider } from '@/lib/providers';
import { createClientFromProvider, createVendorsService } from '@/lib/api';

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
  const provider = await getDefaultProvider();
  if (!provider) {
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
    return NextResponse.json(
      { error: result.error },
      { status: result.error.status }
    );
  }

  return NextResponse.json(result.data);
}
