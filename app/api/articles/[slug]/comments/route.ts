import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/supabase/helpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient()
  const { slug: articleId } = await params

  const { data, error } = await supabase
    .from('commentaries')
    .select('id, article_id, author_id, content_ar, upvotes, created_at, author:profiles!author_id(id, full_name)')
    .eq('article_id', articleId)
    .eq('status', 'approved')
    .eq('type', 'commentary')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase, userId } = authResult

  const { slug: articleId } = await params
  const body = await req.json()
  const content_ar: string = body?.content_ar ?? ''

  if (!content_ar || content_ar.length < 10 || content_ar.length > 2000) {
    return NextResponse.json({ message: 'يجب أن يتراوح التعليق بين 10 و 2000 حرف' }, { status: 422 })
  }

  const { error } = await supabase.from('commentaries').insert({
    article_id: articleId,
    author_id:  userId,
    content_ar,
    type:   'commentary',
    status: 'pending',
  })

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ message: 'تم إرسال تعليقك وسيُنشر بعد المراجعة' }, { status: 201 })
}
