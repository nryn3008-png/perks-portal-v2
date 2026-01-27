import { NextRequest, NextResponse } from 'next/server';
import { whitelistService } from '@/lib/api';

/**
 * GET /api/admin/whitelist/domains
 * Fetch paginated list of whitelisted domains from GetProven API
 * ADMIN ONLY
 *
 * Query params:
 * - page: Page number (default 1)
 * - page_size: Items per page (default 50, max 1000)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('page_size') || '50'), 1000);

  const result = await whitelistService.getDomains(page, pageSize);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error.status }
    );
  }

  return NextResponse.json(result.data);
}
