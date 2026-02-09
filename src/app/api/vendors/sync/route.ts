import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDefaultProvider } from '@/lib/providers';
import { requireAdmin } from '@/lib/bridge/auth';
import { changelogService } from '@/lib/api/changelog-service';
import { logger } from '@/lib/logger';

interface VendorInput {
  vendor_id: number;
  vendor_name: string;
  primary_service: string | null;
  website: string | null;
  perks_count: number;
}

/**
 * POST /api/vendors/sync
 *
 * Syncs vendors with the vendor_tracker table in Supabase.
 * Now includes provider_id to track vendors per provider.
 *
 * Status lifecycle:
 *   - "new"     → first seen within the last 7 days
 *   - "active"  → present in API, first seen more than 7 days ago
 *   - "removed" → previously tracked but no longer returned by API
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Get provider_id from body or use default provider
    let providerId = body.provider_id;
    if (!providerId) {
      const defaultProvider = await getDefaultProvider();
      providerId = defaultProvider?.id || null;
    }

    const vendors: VendorInput[] = body.vendors || [];

    if (vendors.length === 0) {
      return NextResponse.json({ new_vendor_ids: [] });
    }

    const currentVendorIds = new Set(vendors.map((v) => v.vendor_id));
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Get tracked vendors for this provider
    let trackedQuery = supabase
      .from('vendor_tracker')
      .select('vendor_id, first_seen_at, status');

    if (providerId) {
      trackedQuery = trackedQuery.eq('provider_id', providerId);
    }

    const { data: allTracked, error: fetchError } = await trackedQuery;

    if (fetchError) {
      logger.error('[Vendor Sync] Failed to fetch tracked vendors:', fetchError);
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
          website: v.website || null,
          perks_count: v.perks_count || 0,
          status: isRecent ? 'new' : 'active',
          first_seen_at: existing.first_seen_at,
          provider_id: providerId,
        };
      }
      return {
        vendor_id: v.vendor_id,
        vendor_name: v.vendor_name || '',
        primary_service: v.primary_service || null,
        website: v.website || null,
        perks_count: v.perks_count || 0,
        status: 'new',
        provider_id: providerId,
      };
    });

    // Use composite key for upsert (vendor_id + provider_id)
    const { error: upsertError } = await supabase
      .from('vendor_tracker')
      .upsert(upsertRows, { onConflict: 'vendor_id,provider_id' });

    if (upsertError) {
      logger.error('[Vendor Sync] Failed to upsert vendors:', upsertError);
    }

    // 3. Mark removed vendors (for this provider only)
    const removedIds: number[] = [];
    for (const [vendorId, info] of Array.from(trackedMap.entries())) {
      if (!currentVendorIds.has(vendorId) && info.status !== 'removed') {
        removedIds.push(vendorId);
      }
    }

    if (removedIds.length > 0) {
      let removeQuery = supabase
        .from('vendor_tracker')
        .update({ status: 'removed' })
        .in('vendor_id', removedIds);

      if (providerId) {
        removeQuery = removeQuery.eq('provider_id', providerId);
      }

      await removeQuery;
    }

    // 4. Return new vendor IDs
    const newVendorIds: number[] = upsertRows
      .filter((r) => r.status === 'new')
      .map((r) => r.vendor_id);

    // Log to admin changelog
    await changelogService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      action: 'vendors.sync',
      entityType: 'vendors',
      summary: `Synced vendors: ${newVendorIds.length} new, ${removedIds.length} removed, ${vendors.length} total`,
      details: {
        totalVendors: vendors.length,
        newCount: newVendorIds.length,
        removedCount: removedIds.length,
        providerId,
      },
    });

    return NextResponse.json({ new_vendor_ids: newVendorIds });
  } catch (err) {
    logger.error('[Vendor Sync] Unexpected error:', err);
    return NextResponse.json({ new_vendor_ids: [] });
  }
}
