import { NextRequest, NextResponse } from 'next/server';
import { vendorsService } from '@/lib/api';

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
