import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/bridge/auth';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { changelogService } from '@/lib/api/changelog-service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * GET /api/providers
 * List all providers (tokens masked for security)
 */
export async function GET() {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from('providers')
    .select('id, name, slug, api_url, is_active, is_default, owner_email, created_at')
    .order('is_default', { ascending: false })
    .order('name');

  if (error) {
    logger.error('Failed to fetch providers:', error.message, error.details, error.hint);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch providers', status: 500 } },
      { status: 500 }
    );
  }

  return NextResponse.json({ providers: data || [] });
}

/**
 * POST /api/providers
 * Create a new provider
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  try {
    const body = await request.json();
    const { name, slug, api_url, api_token, owner_email } = body;

    // Validate required fields
    if (!name || !slug || !api_url || !api_token) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Name, slug, API URL, and API token are required', status: 400 } },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('providers')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_SLUG', message: 'A provider with this slug already exists', status: 409 } },
        { status: 409 }
      );
    }

    // Insert new provider
    const { data, error } = await supabase
      .from('providers')
      .insert({
        name,
        slug,
        api_url,
        api_token,
        is_active: true,
        is_default: false,
        ...(owner_email && { owner_email }),
      })
      .select('id, name, slug, api_url, is_active, is_default, owner_email, created_at')
      .single();

    if (error) {
      logger.error('Failed to create provider:', error);
      return NextResponse.json(
        { error: { code: 'CREATE_ERROR', message: 'Failed to create provider', status: 500 } },
        { status: 500 }
      );
    }

    // Log to admin changelog
    await changelogService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      action: 'provider.create',
      entityType: 'provider',
      entityId: data.id,
      summary: `Created provider "${name}" (${slug})`,
      details: { name, slug, apiUrl: api_url },
    });

    return NextResponse.json({ provider: data }, { status: 201 });
  } catch (err) {
    logger.error('Invalid request body:', err);
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Invalid request body', status: 400 } },
      { status: 400 }
    );
  }
}
