import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface VendorInput {
  vendor_id: number;
  vendor_name: string;
  primary_service: string | null;
  logo: string | null;
  website: string | null;
}

/**
 * POST /api/vendors/sync
 *
 * Syncs vendors with the vendor_tracker table in Supabase.
 *
 * Status lifecycle:
 *   - "new"     → first seen within the last 7 days
 *   - "active"  → present in API, first seen more than 7 days ago
 *   - "removed" → previously tracked but no longer returned by API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const vendors: VendorInput[] = body.vendors || [];

    if (vendors.length === 0) {
      return NextResponse.json({ new_vendor_ids: [] });
    }

    const currentVendorIds = new Set(vendors.map((v) => v.vendor_id));
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Get ALL tracked vendors
    const { data: allTracked, error: fetchError } = await supabase
      .from('vendor_tracker')
      .select('vendor_id, first_seen_at, status');

    if (fetchError) {
      console.error('[Vendor Sync] Failed to fetch tracked vendors:', fetchError);
      return NextResponse.json({ new_vendor_ids: [] });
    }

    const trackedMap = new Map<number, { first_seen_at: string; status: string }>();
    for (const row of allTracked ?? []) {
      trackedMap.set(row.vendor_id, { first_seen_at: row.first_seen_at, status: row.status });
    }

    // 2. Batch upsert ALL current vendors
    const upsertRows = vendors.map((v) => {
      const existing = trackedMap.get(v.vendor_id);
      if (existing) {
        const isRecent = new Date(existing.first_seen_at) >= sevenDaysAgo;
        return {
          vendor_id: v.vendor_id,
          vendor_name: v.vendor_name || '',
          primary_service: v.primary_service || null,
          logo: v.logo || null,
          website: v.website || null,
          status: isRecent ? 'new' : 'active',
          first_seen_at: existing.first_seen_at,
        };
      }
      return {
        vendor_id: v.vendor_id,
        vendor_name: v.vendor_name || '',
        primary_service: v.primary_service || null,
        logo: v.logo || null,
        website: v.website || null,
        status: 'new',
      };
    });

    const { error: upsertError } = await supabase
      .from('vendor_tracker')
      .upsert(upsertRows, { onConflict: 'vendor_id' });

    if (upsertError) {
      console.error('[Vendor Sync] Failed to upsert vendors:', upsertError);
    }

    // 3. Mark removed vendors
    const removedIds: number[] = [];
    for (const [vendorId, info] of Array.from(trackedMap.entries())) {
      if (!currentVendorIds.has(vendorId) && info.status !== 'removed') {
        removedIds.push(vendorId);
      }
    }

    if (removedIds.length > 0) {
      await supabase
        .from('vendor_tracker')
        .update({ status: 'removed' })
        .in('vendor_id', removedIds);
    }

    // 4. Return new vendor IDs
    const newVendorIds: number[] = upsertRows
      .filter((r) => r.status === 'new')
      .map((r) => r.vendor_id);

    return NextResponse.json({ new_vendor_ids: newVendorIds });
  } catch (err) {
    console.error('[Vendor Sync] Unexpected error:', err);
    return NextResponse.json({ new_vendor_ids: [] });
  }
}
