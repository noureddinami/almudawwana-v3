import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const now = new Date()
  const weekAgo  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString()
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: usersTotal },
    { count: usersActive },
    { count: usersNewWeek },
    { count: usersNewMonth },
    { count: codesTotal },
    { count: codesInForce },
    { count: articlesTotal },
    { count: articlesInForce },
    { count: articlesAmended },
    { count: articlesAbrogated },
    { count: articlesDraft },
    { data: viewsData },
    { count: commentsTotal },
    { count: commentsPending },
    { count: commentsApproved },
    { count: commentsRejected },
    { count: notesTotal },
    { data: topViewed },
    { data: codesBreakdown },
    { data: recentUsers },
    { data: pendingComments },
    { data: activityWeek },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo),

    supabase.from('codes').select('*', { count: 'exact', head: true }),
    supabase.from('codes').select('*', { count: 'exact', head: true }).eq('status', 'in_force'),

    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'in_force'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'amended'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'abrogated'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('articles').select('view_count'),

    supabase.from('commentaries').select('*', { count: 'exact', head: true }).eq('type', 'commentary'),
    supabase.from('commentaries').select('*', { count: 'exact', head: true }).eq('type', 'commentary').eq('status', 'pending'),
    supabase.from('commentaries').select('*', { count: 'exact', head: true }).eq('type', 'commentary').eq('status', 'approved'),
    supabase.from('commentaries').select('*', { count: 'exact', head: true }).eq('type', 'commentary').eq('status', 'rejected'),
    supabase.from('commentaries').select('*', { count: 'exact', head: true }).eq('type', 'annotation'),

    supabase.from('articles').select('id, code_id, number, slug, view_count, status, code:codes(id, slug, title_ar)').order('view_count', { ascending: false }).limit(7),
    supabase.from('codes').select('id, title_ar, slug, total_articles, status').gt('total_articles', 0).order('total_articles', { ascending: false }).limit(10),
    supabase.from('profiles').select('id, full_name, email, role, status, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('commentaries').select('id, article_id, author_id, content_ar, created_at, author:profiles!author_id(id, full_name, email), article:articles(id, number, slug, code_id, code:codes(id, slug, title_ar))').eq('type', 'commentary').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    supabase.from('articles').select('created_at').gte('created_at', weekAgo),
  ])

  // Calculer total_views et activity_week côté JS
  const totalViews = (viewsData ?? []).reduce((sum: number, a: any) => sum + (a.view_count ?? 0), 0)

  const activityMap: Record<string, number> = {}
  ;(activityWeek ?? []).forEach((a: any) => {
    const date = a.created_at.slice(0, 10)
    activityMap[date] = (activityMap[date] ?? 0) + 1
  })
  const activityWeekFormatted = Object.entries(activityMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json({
    users:    { total: usersTotal, active: usersActive, new_week: usersNewWeek, new_month: usersNewMonth },
    codes:    { total: codesTotal, in_force: codesInForce },
    articles: { total: articlesTotal, in_force: articlesInForce, amended: articlesAmended, abrogated: articlesAbrogated, draft: articlesDraft, total_views: totalViews },
    comments: { total: commentsTotal, pending: commentsPending, approved: commentsApproved, rejected: commentsRejected },
    notes:    { total: notesTotal },
    top_viewed:       topViewed ?? [],
    codes_breakdown:  codesBreakdown ?? [],
    recent_users:     recentUsers ?? [],
    pending_comments: pendingComments ?? [],
    activity_week:    activityWeekFormatted,
  })
}
