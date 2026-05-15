import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult
  const { id } = await params

  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (error || !data) return NextResponse.json({ message: 'المستخدم غير موجود' }, { status: 404 })

  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult
  const { id } = await params

  const body = await req.json()
  const allowed = ['role','status','full_name']
  const data = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const { data: user, error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ message: 'تم تحديث المستخدم', user })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult
  const { id } = await params

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', id).single()
  if (profile?.role === 'admin') {
    return NextResponse.json({ message: 'لا يمكن حذف مدير النظام' }, { status: 403 })
  }

  await supabase.from('profiles').delete().eq('id', id)
  return NextResponse.json({ message: 'تم حذف المستخدم' })
}
