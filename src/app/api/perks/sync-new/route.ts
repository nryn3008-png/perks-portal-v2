import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/perks/sync-new
 *
 * Syncs offer IDs with the offer_tracker table in Supabase.
 * - Inserts any new offer IDs not yet tracked (with first_seen_at = now())
 * - Returns IDs first seen within the last 7 days
 */
export async function POST(request: NextRequest) {
  try {
    const { offer_ids } = await request.json();

    if (!Array.isArray(offer_ids) || offer_ids.length === 0) {
      return NextResponse.json({ new_offer_ids: [] });
    }

    // 1. Get all already-tracked offer IDs
    const { data: existing, error: fetchError } = await supabase
      .from('offer_tracker')
      .select('offer_id, first_seen_at')
      .in('offer_id', offer_ids);

    if (fetchError) {
      console.error('[Sync New] Failed to fetch tracked offers:', fetchError);
      return NextResponse.json({ new_offer_ids: [] });
    }

    const trackedIds = new Set(existing?.map((row) => row.offer_id) ?? []);

    // 2. Insert any new (untracked) offer IDs
    const newIds = offer_ids.filter((id: number) => !trackedIds.has(id));

    if (newIds.length > 0) {
      const rows = newIds.map((id: number) => ({ offer_id: id }));
      const { error: insertError } = await supabase
        .from('offer_tracker')
        .insert(rows);

      if (insertError) {
        console.error('[Sync New] Failed to insert new offers:', insertError);
      }
    }

    // 3. Return IDs first seen within the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newOfferIds: number[] = [];

    // Include existing offers that are still within 7 days
    for (const row of existing ?? []) {
      if (new Date(row.first_seen_at) >= sevenDaysAgo) {
        newOfferIds.push(row.offer_id);
      }
    }

    // All freshly inserted IDs are new by definition
    newOfferIds.push(...newIds);

    return NextResponse.json({ new_offer_ids: newOfferIds });
  } catch (err) {
    console.error('[Sync New] Unexpected error:', err);
    return NextResponse.json({ new_offer_ids: [] });
  }
}
