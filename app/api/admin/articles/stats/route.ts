import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const [
    { count: total },
    { count: inForce },
    { count: abrogated },
    { count: amended },
    { data: byCode },
  ] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'in_force'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'abrogated'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'amended'),
    supabase.from('codes').select('title_ar, total_articles').gt('total_articles', 0),
  ])

  return NextResponse.json({
    total,
    in_force:  inForce,
    abrogated,
    amended,
    by_code: (byCode ?? []).map(c => ({ name: c.title_ar, count: c.total_articles })),
  })
}
