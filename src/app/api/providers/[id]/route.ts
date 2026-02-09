import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/bridge/auth';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { clearAccessCache } from '@/lib/api/access-cache';
import { changelogService } from '@/lib/api/changelog-service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * PATCH /api/providers/[id]
 * Update a provider (set default, edit details)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createSupabaseAdmin();

  try {
    const body = await request.json();
    const { name, slug, api_url, api_token, is_active, is_default, owner_email } = body;

    // If setting as default, first unset all others
    if (is_default === true) {
      const { error: unsetError } = await supabase
        .from('providers')
        .update({ is_default: false })
        .neq('id', id);

      if (unsetError) {
        logger.error('Failed to unset default providers:', unsetError);
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
    if (owner_email !== undefined) updateData.owner_email = owner_email || null;

    // Update the provider
    const { data, error } = await supabase
      .from('providers')
      .update(updateData)
      .eq('id', id)
      .select('id, name, slug, api_url, is_active, is_default, owner_email, created_at')
      .single();

    if (error) {
      logger.error('Failed to update provider:', error);
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

    // Purge all cached data for perks and vendors routes
    // revalidatePath purges both Data Cache and Full Route Cache
    revalidatePath('/api/perks', 'page');
    revalidatePath('/api/vendors', 'page');
    revalidatePath('/perks', 'layout');

    // Clear access control cache (whitelist + portfolio data may differ per provider)
    if (is_default === true) {
      clearAccessCache();
    }

    // Log to admin changelog
    const changedFields = Object.keys(updateData);
    await changelogService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      action: 'provider.update',
      entityType: 'provider',
      entityId: id,
      summary: `Updated provider "${data.name}" (${changedFields.join(', ')})`,
      details: {
        providerId: id,
        changedFields,
        newValues: {
          ...updateData,
          api_token: updateData.api_token ? '***' : undefined,
        },
      },
    });

    return NextResponse.json({ provider: data });
  } catch (err) {
    logger.error('Invalid request body:', err);
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
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createSupabaseAdmin();

  // Check if this is the default provider
  const { data: provider } = await supabase
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

  const { error } = await supabase
    .from('providers')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Failed to delete provider:', error);
    return NextResponse.json(
      { error: { code: 'DELETE_ERROR', message: 'Failed to delete provider', status: 500 } },
      { status: 500 }
    );
  }

  // Log to admin changelog
  await changelogService.log({
    adminId: admin.id,
    adminEmail: admin.email,
    adminName: admin.name,
    action: 'provider.delete',
    entityType: 'provider',
    entityId: id,
    summary: `Deleted provider (ID: ${id})`,
    details: { providerId: id },
  });

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
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from('providers')
    .select('id, name, slug, api_url, is_active, is_default, owner_email, created_at')
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
