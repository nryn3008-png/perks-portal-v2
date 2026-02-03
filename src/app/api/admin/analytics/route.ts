import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/bridge/auth';

/**
 * GET /api/admin/analytics
 *
 * Returns redemption analytics data for the admin dashboard.
 * Query params:
 *   - range: "7d" | "30d" | "90d" | "all" (default: "30d")
 *   - page: number (for table pagination, default: 1)
 *   - provider_id: UUID (optional, filter by provider; omit for all providers)
 */
export async function GET(request: NextRequest) {
  // Admin-only access
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get('range') || '30d';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const providerId = searchParams.get('provider_id') || null;
  const pageSize = 20;

  // Calculate date range
  let rangeDate: Date | null = null;
  const now = new Date();
  if (range === '7d') {
    rangeDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === '30d') {
    rangeDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (range === '90d') {
    rangeDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }

  try {
    // Build base query filter
    let baseQuery = supabase.from('redemption_clicks').select('*');
    if (rangeDate) {
      baseQuery = baseQuery.gte('clicked_at', rangeDate.toISOString());
    }
    if (providerId) {
      baseQuery = baseQuery.eq('provider_id', providerId);
    }

    // Fetch all clicks in range (for aggregation)
    const { data: allClicks, error: clicksError } = await baseQuery
      .order('clicked_at', { ascending: false });

    if (clicksError) {
      console.error('[Analytics] Failed to fetch clicks:', clicksError);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    const clicks = allClicks || [];

    // --- Stat cards ---
    const totalClicks = clicks.length;
    const uniqueUsers = new Set(clicks.map((c) => c.user_id)).size;
    const totalValue = clicks.reduce((sum, c) => sum + (Number(c.estimated_value) || 0), 0);

    // This month vs last month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const thisMonthClicks = clicks.filter(
      (c) => new Date(c.clicked_at) >= thisMonthStart
    ).length;

    // Need separate query for last month (might be outside range)
    let lastMonthQuery = supabase
      .from('redemption_clicks')
      .select('id')
      .gte('clicked_at', lastMonthStart.toISOString())
      .lte('clicked_at', lastMonthEnd.toISOString());

    if (providerId) {
      lastMonthQuery = lastMonthQuery.eq('provider_id', providerId);
    }

    const { data: lastMonthData } = await lastMonthQuery;

    const lastMonthClicks = lastMonthData?.length || 0;
    const monthOverMonth = lastMonthClicks === 0
      ? (thisMonthClicks > 0 ? 100 : 0)
      : Math.round(((thisMonthClicks - lastMonthClicks) / lastMonthClicks) * 100);

    // --- Charts ---

    // Clicks per day
    const clicksByDay: Record<string, number> = {};
    const valueByDay: Record<string, number> = {};
    for (const click of clicks) {
      const day = new Date(click.clicked_at).toISOString().split('T')[0];
      clicksByDay[day] = (clicksByDay[day] || 0) + 1;
      valueByDay[day] = (valueByDay[day] || 0) + (Number(click.estimated_value) || 0);
    }

    // Fill in missing days
    const timeSeriesData: { date: string; clicks: number; value: number }[] = [];
    if (clicks.length > 0) {
      const startDate = rangeDate || new Date(clicks[clicks.length - 1].clicked_at);
      const endDate = now;
      const current = new Date(startDate);
      current.setHours(0, 0, 0, 0);

      while (current <= endDate) {
        const dateStr = current.toISOString().split('T')[0];
        timeSeriesData.push({
          date: dateStr,
          clicks: clicksByDay[dateStr] || 0,
          value: valueByDay[dateStr] || 0,
        });
        current.setDate(current.getDate() + 1);
      }
    }

    // Cumulative value over time
    let cumValue = 0;
    const cumulativeValue = timeSeriesData.map((d) => {
      cumValue += d.value;
      return { date: d.date, value: cumValue };
    });

    // Top 10 perks by clicks
    const perkCounts: Record<string, { name: string; count: number }> = {};
    for (const click of clicks) {
      const key = click.offer_id || 'unknown';
      if (!perkCounts[key]) {
        perkCounts[key] = { name: click.offer_name || 'Unknown Perk', count: 0 };
      }
      perkCounts[key].count++;
    }
    const topPerks = Object.values(perkCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top vendors by clicks
    const vendorCounts: Record<string, { name: string; count: number }> = {};
    for (const click of clicks) {
      const key = click.vendor_name || 'Unknown';
      if (!vendorCounts[key]) {
        vendorCounts[key] = { name: key, count: 0 };
      }
      vendorCounts[key].count++;
    }
    const topVendors = Object.values(vendorCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // --- Paginated table ---
    const offset = (page - 1) * pageSize;
    const recentRedemptions = clicks.slice(offset, offset + pageSize);
    const totalPages = Math.ceil(clicks.length / pageSize);

    return NextResponse.json({
      stats: {
        totalClicks,
        uniqueUsers,
        totalValue,
        thisMonthClicks,
        lastMonthClicks,
        monthOverMonth,
      },
      charts: {
        timeSeries: timeSeriesData,
        cumulativeValue,
        topPerks,
        topVendors,
      },
      table: {
        data: recentRedemptions,
        page,
        pageSize,
        totalPages,
        totalRows: clicks.length,
      },
    });
  } catch (err) {
    console.error('[Analytics] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
