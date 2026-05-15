import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, paginationRange, paginatedResponse } from '@/lib/supabase/helpers'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const { searchParams } = new URL(req.url)
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const perPage = 30
  const status  = searchParams.get('status')
  const q       = searchParams.get('q')
  const { from, to } = paginationRange(page, perPage)

  let query = supabase
    .from('commentaries')
    .select(`
      id, article_id, author_id, content_ar, type, status, rejection_reason, upvotes, created_at,
      author:profiles!author_id(id, full_name, email),
      article:articles(id, number, slug, code_id, code:codes(id, slug, title_ar))
    `, { count: 'exact' })
    .eq('type', 'commentary')

  if (status) query = query.eq('status', status)
  if (q)      query = query.ilike('content_ar', `%${q}%`)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json(paginatedResponse(data ?? [], count ?? 0, page, perPage))
}
