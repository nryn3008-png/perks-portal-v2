/**
 * Admin Access Requests API
 *
 * GET  — List access requests (paginated, filterable by status)
 * PATCH — Approve or reject an access request
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/bridge/auth';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { changelogService } from '@/lib/api/changelog-service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/access-requests
 *
 * Query params:
 * - status: 'pending' | 'approved' | 'rejected' | 'all' (default: 'all')
 * - page: number (default: 1)
 * - page_size: number (default: 25)
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Math.min(parseInt(searchParams.get('page_size') || '25', 10), 100);
  const offset = (page - 1) * pageSize;

  const supabase = createSupabaseAdmin();

  try {
    // Count query
    let countQuery = supabase
      .from('access_requests')
      .select('*', { count: 'exact', head: true });

    if (status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;

    // Data query
    let dataQuery = supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (status !== 'all') {
      dataQuery = dataQuery.eq('status', status);
    }

    const { data, error } = await dataQuery;

    if (error) {
      logger.error('[Admin Access Requests] Query error:', error);
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: 'Failed to fetch access requests' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (err) {
    logger.error('[Admin Access Requests] Unexpected error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/access-requests
 *
 * Body:
 * - id: string (access request UUID)
 * - action: 'approve' | 'reject'
 */
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { id?: string; action?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const { id, action } = body;

  if (!id || !action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'id and action (approve/reject) are required',
        },
      },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();

  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  const { data, error } = await supabase
    .from('access_requests')
    .update({
      status: newStatus,
      reviewed_by: admin.email,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('[Admin Access Requests] Update error:', error);
    return NextResponse.json(
      { error: { code: 'UPDATE_ERROR', message: 'Failed to update access request' } },
      { status: 500 }
    );
  }

  // Log to admin changelog
  await changelogService.log({
    adminId: admin.id,
    adminEmail: admin.email,
    adminName: admin.name,
    action: action === 'approve' ? 'access_request.approve' : 'access_request.reject',
    entityType: 'access_request',
    entityId: id,
    summary: `${action === 'approve' ? 'Approved' : 'Rejected'} access request from ${data.user_email}`,
    details: {
      requestId: id,
      userEmail: data.user_email,
      userName: data.user_name,
      companyName: data.company_name,
      vcName: data.vc_name,
      previousStatus: 'pending',
      newStatus,
    },
  });

  return NextResponse.json({
    success: true,
    request: data,
  });
}
