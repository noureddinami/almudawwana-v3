import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult
  const { id } = await params

  const body = await req.json()
  const allowed = ['title_ar','title_fr','type','status','official_number','promulgation_date','source_url']
  const data = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const { data: code, error } = await supabase
    .from('codes')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ message: 'تم تحديث القانون', code })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult
  const { id } = await params

  const { count } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('code_id', id)

  await supabase.from('articles').delete().eq('code_id', id)
  await supabase.from('codes').delete().eq('id', id)

  return NextResponse.json({ message: `تم حذف القانون و${count ?? 0} مادة مرتبطة به` })
}
