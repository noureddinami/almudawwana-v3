import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'
import { paginationRange, paginatedResponse } from '@/lib/supabase/helpers'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const url = new URL(req.url)
  const page   = Number(url.searchParams.get('page') ?? 1)
  const status = url.searchParams.get('status') || undefined
  const q      = url.searchParams.get('q') || undefined
  const perPage = 20

  const { from, to } = paginationRange(page, perPage)

  let query = supabase
    .from('code_requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (q) query = query.or(`code_title.ilike.%${q}%,name.ilike.%${q}%,email.ilike.%${q}%`)

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json(paginatedResponse(data ?? [], count ?? 0, page, perPage))
}
