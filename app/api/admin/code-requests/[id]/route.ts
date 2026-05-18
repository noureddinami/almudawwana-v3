import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, context: RouteContext) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const { id } = await context.params
  const body = await req.json()

  const updates: Record<string, any> = {}
  if (body.status) updates.status = body.status
  if (body.admin_notes !== undefined) updates.admin_notes = body.admin_notes

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: 'لا توجد بيانات للتحديث' }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('code_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'تم التحديث', request: data })
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const { id } = await context.params

  const { error } = await supabase.from('code_requests').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'تم الحذف' })
}
