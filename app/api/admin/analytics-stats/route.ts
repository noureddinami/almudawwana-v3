import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/helpers';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const now      = new Date();
    const today    = now.toISOString().split('T')[0];
    const ago30    = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // ── Run all queries in parallel ─────────────────────────────────────────
    const [
      todayViewsRes,
      todaySearchesRes,
      todayDownloadsRes,
      views30dRes,
      topPagesRes,
      topSearchesRes,
      recentSearchesRes,
      recentDownloadsRes,
      recentViewsRes,
    ] = await Promise.all([
      // today counts
      supabase.from('page_views').select('id', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`),
      supabase.from('search_logs').select('id', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`),
      supabase.from('download_logs').select('id', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`),

      // page views 30 days — raw rows (we'll aggregate by date in JS)
      supabase.from('page_views')
        .select('created_at')
        .gte('created_at', ago30)
        .order('created_at', { ascending: true }),

      // top 8 pages (last 30d)
      supabase.from('page_views')
        .select('path')
        .gte('created_at', ago30),

      // top 10 search queries (last 30d)
      supabase.from('search_logs')
        .select('query')
        .gte('created_at', ago30),

      // recent events: searches
      supabase.from('search_logs')
        .select('query, results_count, created_at')
        .order('created_at', { ascending: false })
        .limit(6),

      // recent events: downloads
      supabase.from('download_logs')
        .select('code_slug, format, created_at')
        .order('created_at', { ascending: false })
        .limit(6),

      // recent events: page views
      supabase.from('page_views')
        .select('path, created_at')
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

    // ── Build 30-day chart ─────────────────────────────────────────────────
    const viewsByDate: Record<string, number> = {};
    for (const row of views30dRes.data ?? []) {
      const d = (row.created_at as string).split('T')[0];
      viewsByDate[d] = (viewsByDate[d] ?? 0) + 1;
    }
    const views30d = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      const k = d.toISOString().split('T')[0];
      return { date: k, count: viewsByDate[k] ?? 0 };
    });

    // ── Aggregate top pages ────────────────────────────────────────────────
    const pageCounts: Record<string, number> = {};
    for (const row of topPagesRes.data ?? []) {
      const p = row.path as string;
      pageCounts[p] = (pageCounts[p] ?? 0) + 1;
    }
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([path, count]) => ({ path, count }));

    // ── Aggregate top searches ─────────────────────────────────────────────
    const qCounts: Record<string, number> = {};
    for (const row of topSearchesRes.data ?? []) {
      const q = (row.query as string).toLowerCase().trim();
      qCounts[q] = (qCounts[q] ?? 0) + 1;
    }
    const topSearches = Object.entries(qCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    // ── Build live event feed (last 12 events across 3 tables) ────────────
    const events: { type: string; label: string; sub?: string; created_at: string }[] = [
      ...(recentSearchesRes.data ?? []).map((r: any) => ({
        type: 'search',
        label: r.query,
        sub:   `${r.results_count} نتيجة`,
        created_at: r.created_at,
      })),
      ...(recentDownloadsRes.data ?? []).map((r: any) => ({
        type: 'download',
        label: r.code_slug,
        sub:   r.format,
        created_at: r.created_at,
      })),
      ...(recentViewsRes.data ?? []).map((r: any) => ({
        type: 'view',
        label: r.path,
        created_at: r.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);

    return NextResponse.json({
      today_views:     todayViewsRes.count     ?? 0,
      today_searches:  todaySearchesRes.count  ?? 0,
      today_downloads: todayDownloadsRes.count ?? 0,
      views30d,
      topPages,
      topSearches,
      events,
    });
  } catch (err) {
    console.error('[analytics-stats]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
