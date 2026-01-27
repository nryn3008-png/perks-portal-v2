import { NextRequest, NextResponse } from 'next/server';
import { perksService } from '@/lib/api';

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
    return NextResponse.json(
      { error: result.error },
      { status: result.error.status }
    );
  }

  return NextResponse.json(result.data);
}
