import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paginationRange, paginatedResponse } from '@/lib/supabase/helpers'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)

  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const perPage = Math.min(200, parseInt(searchParams.get('per_page') ?? '20'))
  const type    = searchParams.get('type')
  const q       = searchParams.get('q')
  const sort    = searchParams.get('sort')

  const { from, to } = paginationRange(page, perPage)

  let query = supabase
    .from('codes')
    .select('id, slug, title_ar, title_fr, type, status, official_number, total_articles, promulgation_date, created_at', { count: 'exact' })

  if (type)       query = query.eq('type', type)
  if (q)          query = query.or(`title_ar.ilike.%${q}%,title_fr.ilike.%${q}%`)
  if (sort === 'latest') {
    query = query.order('created_at', { ascending: false })
  } else {
    query = query.order('title_ar', { ascending: true })
  }

  const { data, count, error } = await query.range(from, to)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json(paginatedResponse(data ?? [], count ?? 0, page, perPage))
}
