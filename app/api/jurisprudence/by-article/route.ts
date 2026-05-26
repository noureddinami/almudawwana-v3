import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const articleId = searchParams.get('article_id')
  const limit     = Math.min(10, parseInt(searchParams.get('limit') ?? '4'))

  if (!articleId) return NextResponse.json({ decisions: [], total: 0 })

  const supabase = createPublicClient()

  // Count total linked decisions
  const { count: total } = await supabase
    .from('jurisprudence_tags')
    .select('*', { count: 'exact', head: true })
    .eq('article_id', articleId)

  if (!total) return NextResponse.json({ decisions: [], total: 0 })

  // Get jurisprudence IDs (distinct)
  const { data: tagRows } = await supabase
    .from('jurisprudence_tags')
    .select('jurisprudence_id')
    .eq('article_id', articleId)
    .limit(limit)

  const ids = [...new Set((tagRows ?? []).map(t => t.jurisprudence_id))].slice(0, limit)

  const { data: decisions } = await supabase
    .from('jurisprudence')
    .select(`
      id, case_number, chamber, chamber_slug, decision_nature,
      subject_short, decision_date, pdf_url, source,
      tags:jurisprudence_tags(id, code_slug, article_number, display_label, article_id)
    `)
    .in('id', ids)
    .order('created_at', { ascending: false })

  return NextResponse.json({
    decisions: decisions ?? [],
    total:     total ?? 0,
  })
}
