import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/server'
import { extractKeywords } from '@/lib/jurisprudence-types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page      = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const perPage   = 10
  const kwRaw     = searchParams.get('keywords') ?? ''
  const caseType  = searchParams.get('case_type') ?? ''
  const result    = searchParams.get('result') ?? ''
  const dateFrom  = searchParams.get('date_from') ?? ''
  const dateTo    = searchParams.get('date_to') ?? ''

  const supabase  = createPublicClient()
  const keywords  = extractKeywords(kwRaw)
  const hasKw     = keywords.length > 0

  let query = supabase
    .from('jurisprudence')
    .select('*', { count: 'exact' })

  if (caseType) query = query.eq('case_type', caseType)
  if (result)   query = query.eq('result', result)
  if (dateFrom) query = query.gte('decision_date', dateFrom)
  if (dateTo)   query = query.lte('decision_date', dateTo)

  if (hasKw) {
    // OR filter: at least one keyword must appear (pre-filter before 60% rule)
    const orFilter = keywords.map(k => `subject.ilike.%${k}%`).join(',')
    query = query.or(orFilter)
  }

  query = query.order('decision_date', { ascending: false })

  if (hasKw) {
    // Fetch up to 1000 pre-filtered rows, then apply 60% rule in JS
    const { data: allData, error } = await query.range(0, 999)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const THRESHOLD = 0.6
    const filtered = (allData ?? []).filter(d => {
      const sub = (d.subject ?? '').toLowerCase()
      const matched = keywords.filter(k => sub.includes(k.toLowerCase())).length
      return matched / keywords.length >= THRESHOLD
    })

    const total    = filtered.length
    const from     = (page - 1) * perPage
    const pageData = filtered.slice(from, from + perPage)

    return NextResponse.json({
      data:         pageData,
      total,
      current_page: page,
      last_page:    Math.ceil(total / perPage) || 1,
      per_page:     perPage,
      keywords,     // echo back for highlighting
    })
  }

  // No keyword filter — paginate directly
  const from = (page - 1) * perPage
  const to   = from + perPage - 1
  const { data, count, error } = await query.range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data:         data ?? [],
    total:        count ?? 0,
    current_page: page,
    last_page:    Math.ceil((count ?? 0) / perPage) || 1,
    per_page:     perPage,
    keywords:     [],
  })
}
