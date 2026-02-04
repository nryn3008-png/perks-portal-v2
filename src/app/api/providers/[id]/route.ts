import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/providers/[id]
 * Update a provider (set default, edit details)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { name, slug, api_url, api_token, is_active, is_default } = body;

    // If setting as default, first unset all others
    if (is_default === true) {
      const { error: unsetError } = await supabaseAdmin
        .from('providers')
        .update({ is_default: false })
        .neq('id', id);

      if (unsetError) {
        console.error('Failed to unset default providers:', unsetError);
        return NextResponse.json(
          { error: { code: 'UPDATE_ERROR', message: 'Failed to update default status', status: 500 } },
          { status: 500 }
        );
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (api_url !== undefined) updateData.api_url = api_url;
    if (api_token !== undefined) updateData.api_token = api_token;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_default !== undefined) updateData.is_default = is_default;

    // Update the provider
    const { data, error } = await supabaseAdmin
      .from('providers')
      .update(updateData)
      .eq('id', id)
      .select('id, name, slug, api_url, is_active, is_default, created_at')
      .single();

    if (error) {
      console.error('Failed to update provider:', error);
      return NextResponse.json(
        { error: { code: 'UPDATE_ERROR', message: 'Failed to update provider', status: 500 } },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Provider not found', status: 404 } },
        { status: 404 }
      );
    }

    // Invalidate cached provider data when provider settings change
    revalidateTag('provider-data');

    return NextResponse.json({ provider: data });
  } catch (err) {
    console.error('Invalid request body:', err);
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Invalid request body', status: 400 } },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/providers/[id]
 * Delete a provider
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check if this is the default provider
  const { data: provider } = await supabaseAdmin
    .from('providers')
    .select('is_default')
    .eq('id', id)
    .single();

  if (provider?.is_default) {
    return NextResponse.json(
      { error: { code: 'CANNOT_DELETE_DEFAULT', message: 'Cannot delete the default provider. Set another provider as default first.', status: 400 } },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from('providers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete provider:', error);
    return NextResponse.json(
      { error: { code: 'DELETE_ERROR', message: 'Failed to delete provider', status: 500 } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

/**
 * GET /api/providers/[id]
 * Get a single provider (with masked token)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('providers')
    .select('id, name, slug, api_url, is_active, is_default, created_at')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Provider not found', status: 404 } },
      { status: 404 }
    );
  }

  return NextResponse.json({ provider: data });
}
