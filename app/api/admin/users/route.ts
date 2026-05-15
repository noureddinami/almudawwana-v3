import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, paginationRange, paginatedResponse } from '@/lib/supabase/helpers'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const { searchParams } = new URL(req.url)
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const perPage = 20
  const q       = searchParams.get('q')
  const role    = searchParams.get('role')
  const status  = searchParams.get('status')
  const { from, to } = paginationRange(page, perPage)

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, username, role, status, auth_provider, karma_points, email_verified_at, last_login_at, created_at', { count: 'exact' })

  if (q)      query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%,username.ilike.%${q}%`)
  if (role)   query = query.eq('role', role)
  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json(paginatedResponse(data ?? [], count ?? 0, page, perPage))
}
