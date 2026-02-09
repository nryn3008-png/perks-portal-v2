/**
 * POST /api/access/animation-shown
 *
 * Marks the scanning animation as shown in the `perks_access` cookie.
 * Called by AccessGate after the animation completes to prevent
 * the animation from replaying on page reloads.
 */

import { NextResponse } from 'next/server';
import { accessService } from '@/lib/api/access-service';

export async function POST() {
  const updated = await accessService.markAnimationShown();

  return NextResponse.json({ success: updated });
}
