import { NextRequest, NextResponse } from 'next/server';
import { resolveAuth } from '@/lib/bridge/auth';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { getDefaultProvider } from '@/lib/providers';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { authenticated, user } = await resolveAuth();
    if (!authenticated || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseAdmin();
    const body = await request.json();

    const {
      offer_id,
      offer_name,
      vendor_name,
      estimated_value,
      getproven_link,
      provider_id: bodyProviderId,
    } = body;

    // Validate required fields
    if (!offer_id || !getproven_link) {
      return NextResponse.json(
        { error: 'Missing required fields: offer_id and getproven_link' },
        { status: 400 }
      );
    }

    // Get provider_id from body or use default provider
    let providerId = bodyProviderId;
    if (!providerId) {
      const defaultProvider = await getDefaultProvider();
      providerId = defaultProvider?.id || null;
    }

    const { error } = await supabase.from('redemption_clicks').insert({
      user_id: user.id,
      user_email: user.email,
      offer_id,
      offer_name,
      vendor_name,
      estimated_value,
      getproven_link,
      provider_id: providerId,
    });

    if (error) {
      logger.error('[Redemption Tracking] Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to track redemption' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[Redemption Tracking] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
