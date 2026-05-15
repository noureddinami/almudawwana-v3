import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult
  const { id } = await params

  const { data, error } = await supabase
    .from('commentaries')
    .select('id, article_id, author_id, content_ar, created_at, author:profiles!author_id(id, full_name)')
    .eq('article_id', id)
    .eq('type', 'annotation')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase, userId } = authResult
  const { id } = await params

  const body = await req.json()
  const content_ar: string = body?.content_ar ?? ''

  if (!content_ar || content_ar.length < 2 || content_ar.length > 5000) {
    return NextResponse.json({ message: 'محتوى الملاحظة يجب بين 2 و 5000 حرف' }, { status: 422 })
  }

  const { data: note, error } = await supabase
    .from('commentaries')
    .insert({ article_id: id, author_id: userId, content_ar, type: 'annotation', status: 'approved' })
    .select('*, author:profiles!author_id(id, full_name)')
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ message: 'تم إضافة الملاحظة', note }, { status: 201 })
}
