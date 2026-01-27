import { NextRequest, NextResponse } from 'next/server';
import { perksService } from '@/lib/api';

/**
 * GET /api/perks/[id]
 * Fetch single offer by ID from GetProven API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
