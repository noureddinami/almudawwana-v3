import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const { ids, status } = await req.json()

  if (!Array.isArray(ids) || !ids.length) return NextResponse.json({ message: 'ids مطلوب' }, { status: 422 })
  if (!['in_force','abrogated','amended','draft'].includes(status)) return NextResponse.json({ message: 'status غير صالح' }, { status: 422 })

  const { error } = await supabase.from('articles').update({ status }).in('id', ids)
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ message: `تم تحديث ${ids.length} مادة` })
}
