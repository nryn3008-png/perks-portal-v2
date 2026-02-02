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
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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

    // 1. Get ALL tracked offers in one query
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

    // 2. Batch upsert ALL current offers in one call
    const upsertRows = offers.map((o) => {
      const existing = trackedMap.get(o.offer_id);
      if (existing) {
        const isRecent = new Date(existing.first_seen_at) >= sevenDaysAgo;
        return {
          offer_id: o.offer_id,
          offer_name: o.offer_name || '',
          estimated_value: o.estimated_value || null,
          getproven_link: o.getproven_link || null,
          status: isRecent ? 'new' : 'active',
          first_seen_at: existing.first_seen_at, // preserve original
        };
      }
      // Brand new offer
      return {
        offer_id: o.offer_id,
        offer_name: o.offer_name || '',
        estimated_value: o.estimated_value || null,
        getproven_link: o.getproven_link || null,
        status: 'new',
      };
    });

    const { error: upsertError } = await supabase
      .from('offer_tracker')
      .upsert(upsertRows, { onConflict: 'offer_id' });

    if (upsertError) {
      console.error('[Sync New] Failed to upsert offers:', upsertError);
    }

    // 3. Mark removed offers in one batch query
    const removedIds: number[] = [];
    for (const [offerId, info] of Array.from(trackedMap.entries())) {
      if (!currentOfferIds.has(offerId) && info.status !== 'removed') {
        removedIds.push(offerId);
      }
    }

    if (removedIds.length > 0) {
      await supabase
        .from('offer_tracker')
        .update({ status: 'removed' })
        .in('offer_id', removedIds);
    }

    // 4. Return IDs with status "new"
    const newOfferIds: number[] = upsertRows
      .filter((r) => r.status === 'new')
      .map((r) => r.offer_id);

    return NextResponse.json({ new_offer_ids: newOfferIds });
  } catch (err) {
    console.error('[Sync New] Unexpected error:', err);
    return NextResponse.json({ new_offer_ids: [] });
  }
}
