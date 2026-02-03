import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

/**
 * GET /api/providers
 * List all providers (tokens masked for security)
 */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('providers')
    .select('id, name, slug, api_url, is_active, is_default, created_at')
    .order('is_default', { ascending: false })
    .order('name');

  if (error) {
    console.error('Failed to fetch providers:', error.message, error.details, error.hint);
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: `Failed to fetch providers: ${error.message}`, status: 500, details: error.details } },
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
  try {
    const body = await request.json();
    const { name, slug, api_url, api_token } = body;

    // Validate required fields
    if (!name || !slug || !api_url || !api_token) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Name, slug, API URL, and API token are required', status: 400 } },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existing } = await supabaseAdmin
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
    const { data, error } = await supabaseAdmin
      .from('providers')
      .insert({
        name,
        slug,
        api_url,
        api_token,
        is_active: true,
        is_default: false,
      })
      .select('id, name, slug, api_url, is_active, is_default, created_at')
      .single();

    if (error) {
      console.error('Failed to create provider:', error);
      return NextResponse.json(
        { error: { code: 'CREATE_ERROR', message: 'Failed to create provider', status: 500 } },
        { status: 500 }
      );
    }

    return NextResponse.json({ provider: data }, { status: 201 });
  } catch (err) {
    console.error('Invalid request body:', err);
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Invalid request body', status: 400 } },
      { status: 400 }
    );
  }
}
