import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { extractKeywords, scoreText } from '@/lib/arabic-search'

export const dynamic = 'force-dynamic'

const PER_PAGE = 10

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page      = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const rawQuery  = searchParams.get('subject')   ?? ''
  const caseType  = searchParams.get('case_type') ?? ''
  const resultVal = searchParams.get('result')    ?? ''
  const dateFrom  = searchParams.get('date_from') ?? ''
  const dateTo    = searchParams.get('date_to')   ?? ''

  const supabase  = createServiceClient()
  const keywords  = extractKeywords(rawQuery)
  const hasKw     = keywords.length > 0
  const hasFilter = hasKw || caseType || resultVal || dateFrom || dateTo

  // ── No active search/filter → return random 50 (initial view) ──────────────
  if (!hasFilter) {
    try {
      const { data, error } = await supabase.rpc('get_random_jurisprudence', { p_limit: 50 })
      if (!error && data?.length) {
        return NextResponse.json({
          data:         data,
          total:        data.length,
          current_page: 1,
          last_page:    1,
          per_page:     50,
          mode:         'random',
        })
      }
    } catch { /* fall through to regular query */ }

    // Fallback: latest 50 if RPC not yet created
    const { data } = await supabase
      .from('jurisprudence')
      .select('*')
      .order('decision_date', { ascending: false })
      .limit(50)
    return NextResponse.json({
      data:         data ?? [],
      total:        data?.length ?? 0,
      current_page: 1,
      last_page:    1,
      per_page:     50,
      mode:         'latest',
    })
  }

  // ── Keyword search with scoring ────────────────────────────────────────────
  if (hasKw) {
    // Try the SQL RPC first (faster, handles 50% threshold server-side)
    try {
      const rpcParams: Record<string, unknown> = {
        keywords,
        min_score:   0.5,
        p_limit:     1000,
        p_offset:    0,
      }
      if (caseType) rpcParams.p_case_type = caseType
      if (resultVal) rpcParams.p_result    = resultVal
      if (dateFrom)  rpcParams.p_date_from = dateFrom
      if (dateTo)    rpcParams.p_date_to   = dateTo

      const { data: rpcData, error: rpcErr } = await supabase
        .rpc('search_jurisprudence', rpcParams)

      if (!rpcErr && rpcData) {
        const total  = rpcData.length
        const from   = (page - 1) * PER_PAGE
        const paged  = rpcData.slice(from, from + PER_PAGE)
        return NextResponse.json({
          data:         paged,
          total,
          current_page: page,
          last_page:    Math.ceil(total / PER_PAGE) || 1,
          per_page:     PER_PAGE,
          keywords,
          mode:         'rpc_search',
        })
      }
    } catch { /* fall through to JS scoring */ }

    // JS-side scoring fallback (works without SQL function)
    let query = supabase.from('jurisprudence').select('*')

    // Pre-filter: at least one keyword must appear
    const orParts = keywords.map(k => `subject.ilike.%${k}%`).join(',')
    query = query.or(orParts)

    // Optional filters — include NULL records too (tâche 1C)
    if (caseType)  query = query.or(`case_type.eq.${caseType},case_type.is.null`)
    if (resultVal) query = query.or(`result.eq.${resultVal},result.is.null`)
    if (dateFrom)  query = query.gte('decision_date', dateFrom)
    if (dateTo)    query = query.lte('decision_date', dateTo)

    const { data: allData, error } = await query.order('decision_date', { ascending: false }).limit(1000)

    if (error) {
      console.error('[jurisprudence] search error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    type ScoredRow = Record<string, unknown> & { score: number }
    const MIN_SCORE = 0.5
    const scored: ScoredRow[] = (allData ?? [])
      .map((d: Record<string, unknown>) => ({ ...d, score: scoreText(String(d.subject ?? ''), keywords) }))
      .filter((d: ScoredRow) => d.score >= MIN_SCORE)
      .sort((a: ScoredRow, b: ScoredRow) => b.score - a.score)

    const total  = scored.length
    const from   = (page - 1) * PER_PAGE
    const paged  = scored.slice(from, from + PER_PAGE)

    return NextResponse.json({
      data:         paged,
      total,
      current_page: page,
      last_page:    Math.ceil(total / PER_PAGE) || 1,
      per_page:     PER_PAGE,
      keywords,
      mode:         'js_search',
    })
  }

  // ── Filters only (no keyword) ───────────────────────────────────────────────
  let query = supabase.from('jurisprudence').select('*', { count: 'exact' })

  // Tâche 1C: include NULL values when a filter is active
  if (caseType)  query = query.or(`case_type.eq.${caseType},case_type.is.null`)
  if (resultVal) query = query.or(`result.eq.${resultVal},result.is.null`)
  if (dateFrom)  query = query.gte('decision_date', dateFrom)
  if (dateTo)    query = query.lte('decision_date', dateTo)

  query = query.order('decision_date', { ascending: false })

  const from = (page - 1) * PER_PAGE
  const to   = from + PER_PAGE - 1

  const { data, count, error } = await query.range(from, to)
  if (error) {
    console.error('[jurisprudence] filter error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data:         data ?? [],
    total:        count ?? 0,
    current_page: page,
    last_page:    Math.ceil((count ?? 0) / PER_PAGE) || 1,
    per_page:     PER_PAGE,
    keywords:     [],
    mode:         'filtered',
  })
}
