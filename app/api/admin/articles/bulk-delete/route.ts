import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const { ids } = await req.json()
  if (!Array.isArray(ids) || !ids.length) return NextResponse.json({ message: 'ids مطلوب' }, { status: 422 })

  const { error, count } = await supabase.from('articles').delete({ count: 'exact' }).in('id', ids)
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ message: `تم حذف ${count ?? ids.length} مادة` })
}
