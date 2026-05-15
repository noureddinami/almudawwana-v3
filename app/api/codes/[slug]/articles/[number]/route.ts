import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; number: string }> }
) {
  const supabase = await createClient()
  const { slug, number } = await params

  const { data: code } = await supabase
    .from('codes')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!code) return NextResponse.json({ message: 'القانون غير موجود' }, { status: 404 })

  // number peut être un slug d'article ou un numéro d'article
  const { data: article, error } = await supabase
    .from('articles')
    .select('*, code:codes(id, slug, title_ar, title_fr), section:sections(id, title_ar, number), tags:article_tags(tag:tags(id, name_ar, name_fr, slug))')
    .eq('code_id', code.id)
    .or(`slug.eq.${number},number.eq.${number}`)
    .single()

  if (error || !article) return NextResponse.json({ message: 'المادة غير موجودة' }, { status: 404 })

  // Incrémenter le compteur de vues
  try { await supabase.rpc('increment_view_count', { article_id: article.id }) } catch { /* silencieux */ }

  // Annotations admin (type=annotation, statut=approved)
  const { data: adminNotes } = await supabase
    .from('commentaries')
    .select('id, article_id, author_id, content_ar, created_at, author:profiles!author_id(id, full_name)')
    .eq('article_id', article.id)
    .eq('type', 'annotation')
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  const tags = (article.tags ?? []).map((t: any) => t.tag).filter(Boolean)

  return NextResponse.json({ ...article, tags, admin_notes: adminNotes ?? [] })
}
