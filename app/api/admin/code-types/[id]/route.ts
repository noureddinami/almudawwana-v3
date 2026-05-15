import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult
  const { id } = await params

  const body = await req.json()
  const allowed = ['name_ar','name_fr','color','sort_order']
  const data = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const { data: updated, error } = await supabase
    .from('code_types')
    .update(data)
    .eq('id', parseInt(id))
    .select()
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  const { count } = await supabase
    .from('codes')
    .select('*', { count: 'exact', head: true })
    .eq('type', (updated as any).slug)

  return NextResponse.json({ ...updated, codes_count: count ?? 0 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult
  const { id } = await params

  const { data: ct } = await supabase
    .from('code_types')
    .select('slug')
    .eq('id', parseInt(id))
    .single()

  if (ct) {
    const { count } = await supabase
      .from('codes')
      .select('*', { count: 'exact', head: true })
      .eq('type', ct.slug)

    if (count && count > 0) {
      return NextResponse.json({ error: `لا يمكن حذف هذا النوع، هناك ${count} قانون مرتبط به` }, { status: 422 })
    }
  }

  await supabase.from('code_types').delete().eq('id', parseInt(id))
  return new NextResponse(null, { status: 204 })
}
