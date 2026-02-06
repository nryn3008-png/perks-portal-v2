import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDefaultProvider } from '@/lib/providers';
import { logger } from '@/lib/logger';

interface OfferInput {
  offer_id: number;
  offer_name: string;
  vendor_name: string;
  estimated_value: string | null;
  getproven_link: string | null;
}

/**
 * POST /api/perks/sync-new
 *
 * Syncs offers with the offer_tracker table in Supabase.
 * Now includes provider_id to track offers per provider.
 *
 * Status lifecycle:
 *   - "new"     → first seen within the last 7 days
 *   - "active"  → present in API, first seen more than 7 days ago
 *   - "removed" → previously tracked but no longer returned by API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get provider_id from body or use default provider
    let providerId = body.provider_id;
    if (!providerId) {
      const defaultProvider = await getDefaultProvider();
      providerId = defaultProvider?.id || null;
    }

    const offers: OfferInput[] = body.offers || (body.offer_ids || []).map((id: number) => ({
      offer_id: id,
      offer_name: '',
      vendor_name: '',
      estimated_value: null,
      getproven_link: null,
    }));

    if (offers.length === 0) {
      return NextResponse.json({ new_offer_ids: [] });
    }

    const currentOfferIds = new Set(offers.map((o) => o.offer_id));
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Get tracked offers for this provider
    let trackedQuery = supabase
      .from('offer_tracker')
      .select('offer_id, first_seen_at, status');

    if (providerId) {
      trackedQuery = trackedQuery.eq('provider_id', providerId);
    }

    const { data: allTracked, error: fetchError } = await trackedQuery;

    if (fetchError) {
      logger.error('[Sync New] Failed to fetch tracked offers:', fetchError);
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
          vendor_name: o.vendor_name || '',
          estimated_value: o.estimated_value || null,
          getproven_link: o.getproven_link || null,
          status: isRecent ? 'new' : 'active',
          first_seen_at: existing.first_seen_at, // preserve original
          provider_id: providerId,
        };
      }
      // Brand new offer
      return {
        offer_id: o.offer_id,
        offer_name: o.offer_name || '',
        vendor_name: o.vendor_name || '',
        estimated_value: o.estimated_value || null,
        getproven_link: o.getproven_link || null,
        status: 'new',
        provider_id: providerId,
      };
    });

    // Use composite key for upsert (offer_id + provider_id)
    const { error: upsertError } = await supabase
      .from('offer_tracker')
      .upsert(upsertRows, { onConflict: 'offer_id,provider_id' });

    if (upsertError) {
      logger.error('[Sync New] Failed to upsert offers:', upsertError);
    }

    // 3. Mark removed offers in one batch query (for this provider only)
    const removedIds: number[] = [];
    for (const [offerId, info] of Array.from(trackedMap.entries())) {
      if (!currentOfferIds.has(offerId) && info.status !== 'removed') {
        removedIds.push(offerId);
      }
    }

    if (removedIds.length > 0) {
      let removeQuery = supabase
        .from('offer_tracker')
        .update({ status: 'removed' })
        .in('offer_id', removedIds);

      if (providerId) {
        removeQuery = removeQuery.eq('provider_id', providerId);
      }

      await removeQuery;
    }

    // 4. Return IDs with status "new"
    const newOfferIds: number[] = upsertRows
      .filter((r) => r.status === 'new')
      .map((r) => r.offer_id);

    return NextResponse.json({ new_offer_ids: newOfferIds });
  } catch (err) {
    logger.error('[Sync New] Unexpected error:', err);
    return NextResponse.json({ new_offer_ids: [] });
  }
}
