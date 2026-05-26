import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const perPage = 20
  const from    = (page - 1) * perPage
  const to      = from + perPage - 1

  const search  = searchParams.get('search')  ?? ''
  const chamber = searchParams.get('chamber') ?? ''
  const year    = searchParams.get('year')    ?? ''

  const supabase = createPublicClient()

  let query = supabase
    .from('jurisprudence')
    .select(`
      id, case_number, chamber, chamber_slug, decision_nature,
      subject_short, decision_date, pdf_url, source, created_at,
      tags:jurisprudence_tags(id, code_slug, article_number, display_label, article_id)
    `, { count: 'exact' })

  if (chamber) query = query.eq('chamber_slug', chamber)
  if (year)    query = query.gte('decision_date', `${year}-01-01`).lte('decision_date', `${year}-12-31`)
  if (search)  query = query.or(
    `case_number.ilike.%${search}%,subject.ilike.%${search}%,subject_short.ilike.%${search}%`
  )

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const total    = count ?? 0
  const lastPage = Math.ceil(total / perPage) || 1

  return NextResponse.json({
    data:         data ?? [],
    total,
    current_page: page,
    last_page:    lastPage,
    per_page:     perPage,
  })
}
