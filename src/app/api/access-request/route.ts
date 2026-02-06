/**
 * Access Request API
 *
 * GET  — Fetch the current user's most recent access request
 * POST — Submit a new manual access request
 *
 * Inserts into Supabase `access_requests` table.
 * Returns 409 if a pending request already exists for the user.
 */

import { NextResponse } from 'next/server';
import { resolveAuth } from '@/lib/bridge';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/access-request
 *
 * Returns the current user's most recent access request (if any).
 * Used by the Access Restricted page to show status instead of the form.
 */
export async function GET() {
  const { authenticated, user, error } = await resolveAuth();

  if (!authenticated || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: error || 'Not authenticated', status: 401 } },
      { status: 401 }
    );
  }

  const supabase = createSupabaseAdmin();

  // Fetch most recent request for this user (pending first, then by date)
  const { data: requests } = await supabase
    .from('access_requests')
    .select('*')
    .eq('user_email', user.email.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(5);

  if (!requests || requests.length === 0) {
    return NextResponse.json({ request: null });
  }

  // Prioritize: pending > rejected > approved (approved shouldn't happen on this page)
  const pending = requests.find((r) => r.status === 'pending');
  if (pending) {
    return NextResponse.json({ request: pending });
  }

  // Return most recent (which is first due to ordering)
  return NextResponse.json({ request: requests[0] });
}

export async function POST(request: Request) {
  // Authenticate user
  const { authenticated, user, error } = await resolveAuth();

  if (!authenticated || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: error || 'Not authenticated', status: 401 } },
      { status: 401 }
    );
  }

  // Parse request body
  let body: {
    company_name?: string;
    vc_name?: string;
    vc_contact_name?: string;
    vc_contact_email?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Invalid JSON body', status: 400 } },
      { status: 400 }
    );
  }

  // Validate required fields
  const companyName = body.company_name?.trim();
  const vcName = body.vc_name?.trim();

  if (!companyName || !vcName) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'company_name and vc_name are required',
          status: 400,
        },
      },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();

  // Check for existing pending request
  const { data: existingRequest } = await supabase
    .from('access_requests')
    .select('id')
    .eq('user_email', user.email.toLowerCase())
    .eq('status', 'pending')
    .limit(1)
    .single();

  if (existingRequest) {
    return NextResponse.json(
      {
        error: {
          code: 'DUPLICATE_REQUEST',
          message: 'You already have a pending access request',
          status: 409,
        },
      },
      { status: 409 }
    );
  }

  // Insert new access request
  const { data: newRequest, error: insertError } = await supabase
    .from('access_requests')
    .insert({
      user_id: user.id,
      user_email: user.email.toLowerCase(),
      user_name: user.name || '',
      company_name: companyName,
      vc_name: vcName,
      vc_contact_name: body.vc_contact_name?.trim() || '',
      vc_contact_email: body.vc_contact_email?.trim() || '',
      status: 'pending',
    })
    .select()
    .single();

  if (insertError) {
    logger.error('[Access Request] Insert error:', insertError);
    return NextResponse.json(
      {
        error: {
          code: 'INSERT_ERROR',
          message: 'Failed to submit access request',
          status: 500,
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    request: {
      id: newRequest.id,
      status: newRequest.status,
      created_at: newRequest.created_at,
    },
  });
}
