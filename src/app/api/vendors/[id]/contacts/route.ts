import { NextRequest, NextResponse } from 'next/server';
import { vendorsService } from '@/lib/api';

/**
 * GET /api/vendors/[id]/contacts
 * Fetch vendor contacts from GetProven API
 * Returns only relevant roles (owner, contact_person)
 * Does NOT expose phone numbers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await vendorsService.getVendorContacts(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error.status }
    );
  }

  // Strip phone numbers from response for privacy
  const contactsWithoutPhone = result.data.map(({ phone, ...contact }) => contact);

  return NextResponse.json(contactsWithoutPhone);
}
