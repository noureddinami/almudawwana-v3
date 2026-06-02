import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page      = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const perPage   = 10
  const subject   = searchParams.get('subject')   ?? ''   // min 5 chars enforced client-side
  const caseType  = searchParams.get('case_type') ?? ''
  const result    = searchParams.get('result')    ?? ''
  const dateFrom  = searchParams.get('date_from') ?? ''
  const dateTo    = searchParams.get('date_to')   ?? ''

  const supabase = createPublicClient()
  let query = supabase
    .from('jurisprudence')
    .select('*', { count: 'exact' })

  if (caseType)           query = query.eq('case_type', caseType)
  if (result)             query = query.eq('result', result)
  if (dateFrom)           query = query.gte('decision_date', dateFrom)
  if (dateTo)             query = query.lte('decision_date', dateTo)
  if (subject.length >= 5) query = query.ilike('subject', `%${subject}%`)

  query = query.order('decision_date', { ascending: false })

  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  const { data, count, error } = await query.range(from, to)

  if (error) {
    console.error('[jurisprudence] error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data:         data ?? [],
    total:        count ?? 0,
    current_page: page,
    last_page:    Math.ceil((count ?? 0) / perPage) || 1,
    per_page:     perPage,
  })
}
