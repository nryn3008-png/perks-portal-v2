import { NextRequest, NextResponse } from 'next/server';
import { resolveAuth } from '@/lib/bridge/auth';
import { supabase } from '@/lib/supabase';

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

    const body = await request.json();

    const {
      offer_id,
      offer_name,
      vendor_name,
      estimated_value,
      getproven_link,
    } = body;

    // Validate required fields
    if (!offer_id || !getproven_link) {
      return NextResponse.json(
        { error: 'Missing required fields: offer_id and getproven_link' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('redemption_clicks').insert({
      user_id: user.id,
      user_email: user.email,
      offer_id,
      offer_name,
      vendor_name,
      estimated_value,
      getproven_link,
    });

    if (error) {
      console.error('[Redemption Tracking] Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to track redemption' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Redemption Tracking] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
