import { NextRequest, NextResponse } from 'next/server';
import { getDefaultProvider } from '@/lib/providers';
import { createClientFromProvider, createVendorsService } from '@/lib/api';
import type { VendorUser } from '@/types';

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
  const result = await vendorsService.getVendorContacts(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error.status }
    );
  }

  // Strip phone numbers from response for privacy
  const contactsWithoutPhone = result.data.map(({ phone, ...contact }: VendorUser) => contact);

  return NextResponse.json(contactsWithoutPhone);
}
