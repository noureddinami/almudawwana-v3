import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult
  const { id } = await params

  const { data, error } = await supabase
    .from('articles')
    .select('*, code:codes(id, slug, title_ar), section:sections(id, title_ar)')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ message: 'المادة غير موجودة' }, { status: 404 })

  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult
  const { id } = await params

  const body = await req.json()
  const allowed = ['content_ar','content_fr','status','number']
  const data = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const { data: article, error } = await supabase
    .from('articles')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ message: 'تم تحديث المادة', article })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult
  const { id } = await params

  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ message: 'تم حذف المادة' })
}
