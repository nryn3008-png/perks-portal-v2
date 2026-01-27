import { NextRequest, NextResponse } from 'next/server';
import { vendorsService } from '@/lib/api';

/**
 * GET /api/vendors/[id]/clients
 * Fetch vendor clients from GetProven API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await vendorsService.getVendorClients(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error.status }
    );
  }

  return NextResponse.json(result.data);
}
