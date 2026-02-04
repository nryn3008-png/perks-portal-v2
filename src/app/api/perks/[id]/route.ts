import { NextRequest, NextResponse } from 'next/server';
import { getDefaultProvider } from '@/lib/providers';
import { createClientFromProvider, createPerksService } from '@/lib/api';

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
  const provider = await getDefaultProvider();
  if (!provider) {
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
    return NextResponse.json(
      { error: result.error },
      { status: result.error.status }
    );
  }

  return NextResponse.json(result.data);
}

// TODO: Implement PATCH for updating perk visibility/settings (admin only)
// export async function PATCH(request: NextRequest, { params }) {
//   // Verify admin auth
//   // Update perk settings
// }

// TODO: Implement DELETE for removing custom perks (admin only)
// export async function DELETE(request: NextRequest, { params }) {
//   // Verify admin auth
//   // Delete perk
// }
