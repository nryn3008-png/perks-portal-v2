/**
 * Admin Changelog API
 *
 * GET — Paginated list of admin audit log entries with optional filters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/bridge/auth';
import { changelogService } from '@/lib/api/changelog-service';
import { logger } from '@/lib/logger';
import type { ChangelogAction, ChangelogEntityType } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/changelog
 *
 * Query params:
 * - page: number (default: 1)
 * - page_size: number (default: 25, max: 100)
 * - action: ChangelogAction (optional filter)
 * - entity_type: ChangelogEntityType (optional filter)
 * - admin_email: string (optional filter)
 * - date_from: ISO string (optional)
 * - date_to: ISO string (optional)
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const page = parseInt(params.get('page') || '1', 10);
  const pageSize = Math.min(parseInt(params.get('page_size') || '25', 10), 100);

  const filters = {
    action: (params.get('action') || undefined) as ChangelogAction | undefined,
    entityType: (params.get('entity_type') || undefined) as ChangelogEntityType | undefined,
    adminEmail: params.get('admin_email') || undefined,
    dateFrom: params.get('date_from') || undefined,
    dateTo: params.get('date_to') || undefined,
  };

  try {
    const result = await changelogService.list(page, pageSize, filters);
    return NextResponse.json(result);
  } catch (err) {
    logger.error('[Admin Changelog] Query error:', err);
    return NextResponse.json(
      { error: { code: 'QUERY_ERROR', message: 'Failed to fetch changelog' } },
      { status: 500 }
    );
  }
}
