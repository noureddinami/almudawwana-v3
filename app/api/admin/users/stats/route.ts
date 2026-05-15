import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const todayStart = new Date(); todayStart.setHours(0,0,0,0)
  const weekAgo    = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: total },
    { count: active },
    { count: suspended },
    { data: byRole },
    { count: newToday },
    { count: newWeek },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
    supabase.from('profiles').select('role'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
  ])

  const roleMap: Record<string, number> = {}
  ;(byRole ?? []).forEach((u: any) => { roleMap[u.role] = (roleMap[u.role] ?? 0) + 1 })

  return NextResponse.json({ total, active, suspended, by_role: roleMap, new_today: newToday, new_week: newWeek })
}
