import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase, userId } = authResult
  const { id } = await params

  const body = await req.json()
  const { status, rejection_reason } = body

  const updateData: Record<string, any> = {}
  if (status) {
    if (!['approved','rejected','pending'].includes(status)) {
      return NextResponse.json({ message: 'status غير صالح' }, { status: 422 })
    }
    updateData.status        = status
    updateData.reviewed_by   = userId
    updateData.reviewed_at   = new Date().toISOString()
  }
  if (rejection_reason !== undefined) updateData.rejection_reason = rejection_reason

  const { data: comment, error } = await supabase
    .from('commentaries')
    .update(updateData)
    .eq('id', id)
    .select('*, article:articles(id)')
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  // Recalculer comment_count de l'article
  const { count } = await supabase
    .from('commentaries')
    .select('*', { count: 'exact', head: true })
    .eq('article_id', comment.article_id)
    .eq('type', 'commentary')
    .eq('status', 'approved')

  await supabase.from('articles').update({ comment_count: count ?? 0 }).eq('id', comment.article_id)

  return NextResponse.json({ message: 'تم تحديث التعليق', comment })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult
  const { id } = await params

  const { data: comment } = await supabase
    .from('commentaries')
    .select('article_id')
    .eq('id', id)
    .single()

  await supabase.from('commentaries').delete().eq('id', id)

  if (comment) {
    const { count } = await supabase
      .from('commentaries')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', comment.article_id)
      .eq('type', 'commentary')
      .eq('status', 'approved')

    await supabase.from('articles').update({ comment_count: count ?? 0 }).eq('id', comment.article_id)
  }

  return NextResponse.json({ message: 'تم حذف التعليق' })
}
