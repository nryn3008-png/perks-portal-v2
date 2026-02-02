import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface OfferInput {
  offer_id: number;
  offer_name: string;
  estimated_value: string | null;
  getproven_link: string | null;
}

/**
 * POST /api/perks/sync-new
 *
 * Syncs offers with the offer_tracker table in Supabase.
 *
 * Status lifecycle:
 *   - "new"     → first seen within the last 7 days
 *   - "active"  → present in API, first seen more than 7 days ago
 *   - "removed" → previously tracked but no longer returned by API
 *
 * On each sync:
 *   1. Inserts unseen offers as "new"
 *   2. Marks returning offers as "active" (or keeps "new" if < 7 days)
 *   3. Marks offers NOT in current batch as "removed"
 *   4. Updates offer metadata (name, value, link)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support both old format { offer_ids: [] } and new { offers: [] }
    const offers: OfferInput[] = body.offers || (body.offer_ids || []).map((id: number) => ({
      offer_id: id,
      offer_name: '',
      estimated_value: null,
      getproven_link: null,
    }));

    if (offers.length === 0) {
      return NextResponse.json({ new_offer_ids: [] });
    }

    const currentOfferIds = new Set(offers.map((o) => o.offer_id));
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Get ALL tracked offers (not just current batch)
    const { data: allTracked, error: fetchError } = await supabase
      .from('offer_tracker')
      .select('offer_id, first_seen_at, status');

    if (fetchError) {
      console.error('[Sync New] Failed to fetch tracked offers:', fetchError);
      return NextResponse.json({ new_offer_ids: [] });
    }

    const trackedMap = new Map<number, { first_seen_at: string; status: string }>();
    for (const row of allTracked ?? []) {
      trackedMap.set(row.offer_id, { first_seen_at: row.first_seen_at, status: row.status });
    }

    // 2. Insert brand-new offers (never seen before) with status "new"
    const brandNewOffers = offers.filter((o) => !trackedMap.has(o.offer_id));

    if (brandNewOffers.length > 0) {
      const rows = brandNewOffers.map((o) => ({
        offer_id: o.offer_id,
        offer_name: o.offer_name || '',
        estimated_value: o.estimated_value || null,
        getproven_link: o.getproven_link || null,
        status: 'new',
      }));
      const { error: insertError } = await supabase
        .from('offer_tracker')
        .insert(rows);

      if (insertError) {
        console.error('[Sync New] Failed to insert new offers:', insertError);
      }
    }

    // 3. Update existing offers that are in the current batch
    const existingInBatch = offers.filter((o) => trackedMap.has(o.offer_id));

    for (const o of existingInBatch) {
      const tracked = trackedMap.get(o.offer_id)!;
      const isRecent = new Date(tracked.first_seen_at) >= sevenDaysAgo;
      const newStatus = isRecent ? 'new' : 'active';

      await supabase
        .from('offer_tracker')
        .update({
          offer_name: o.offer_name || undefined,
          estimated_value: o.estimated_value || null,
          getproven_link: o.getproven_link || null,
          status: newStatus,
        })
        .eq('offer_id', o.offer_id);
    }

    // 4. Mark offers NOT in current batch as "removed"
    const removedIds: number[] = [];
    for (const [offerId, info] of Array.from(trackedMap.entries())) {
      if (!currentOfferIds.has(offerId) && info.status !== 'removed') {
        removedIds.push(offerId);
      }
    }

    if (removedIds.length > 0) {
      const { error: removeError } = await supabase
        .from('offer_tracker')
        .update({ status: 'removed' })
        .in('offer_id', removedIds);

      if (removeError) {
        console.error('[Sync New] Failed to mark removed offers:', removeError);
      }
    }

    // 5. Return IDs with status "new" (first seen within 7 days)
    const newOfferIds: number[] = [];

    // From existing tracked offers still within 7 days
    for (const row of allTracked ?? []) {
      if (currentOfferIds.has(row.offer_id) && new Date(row.first_seen_at) >= sevenDaysAgo) {
        newOfferIds.push(row.offer_id);
      }
    }

    // All freshly inserted offers are new by definition
    newOfferIds.push(...brandNewOffers.map((o) => o.offer_id));

    return NextResponse.json({ new_offer_ids: newOfferIds });
  } catch (err) {
    console.error('[Sync New] Unexpected error:', err);
    return NextResponse.json({ new_offer_ids: [] });
  }
}
