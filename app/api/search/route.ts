import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createPublicClient()
  const { searchParams } = new URL(req.url)

  const q        = searchParams.get('q')?.trim() ?? ''
  const kw       = searchParams.get('kw')?.trim() ?? ''
  const codeId   = searchParams.get('code') ?? ''
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const perPage  = Math.min(50, parseInt(searchParams.get('per_page') ?? '20'))

  if (!q && !kw) {
    return NextResponse.json({ message: 'q أو kw مطلوب' }, { status: 422 })
  }

  const COLS = 'id, code_id, number, number_int, slug, content_ar, status, view_count, comment_count, code:codes(id, slug, title_ar)'

  // ── Recherche par mots-clés multiples (60 % threshold) ──────────────────
  if (kw) {
    const keywords = kw.split(/[,،\-\s]+/).map(w => w.trim()).filter(w => w.length >= 2)
    if (!keywords.length) {
      return NextResponse.json({ message: 'أدخل كلمة بحث صالحة' }, { status: 422 })
    }

    const threshold = Math.ceil(keywords.length * 0.6)
    const orFilter = keywords.map(w => `content_ar.ilike.%${w}%`).join(',')

    let query = supabase
      .from('articles')
      .select(COLS)
      .or(orFilter)
      .order('view_count', { ascending: false })
      .limit(1000)

    if (codeId) query = query.eq('code_id', codeId)

    const { data: articles, error } = await query
    if (error) return NextResponse.json({ message: error.message }, { status: 500 })

    const filtered = (articles ?? []).filter(a => {
      const content = a.content_ar?.toLowerCase() ?? ''
      return keywords.filter(w => content.includes(w.toLowerCase())).length >= threshold
    })

    const total = filtered.length
    const from = (page - 1) * perPage
    return NextResponse.json({
      query: kw,
      results: {
        data: filtered.slice(from, from + perPage),
        current_page: page,
        last_page: Math.ceil(total / perPage) || 1,
        total,
        per_page: perPage,
        from: from + 1,
        to: Math.min(from + perPage, total),
      },
    })
  }

  // ── Recherche par numéro d'article ──────────────────────────────────────
  const numMatch = q.match(/^(\d[\d\-–.]*)/)
  if (numMatch) {
    const num = numMatch[1]
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    let query = supabase
      .from('articles')
      .select(COLS, { count: 'exact' })
      .or(`number.eq.${num},number.like.${num}-%,number.like.${num}.%`)
      .order('number_int', { ascending: true, nullsFirst: false })

    if (codeId) query = query.eq('code_id', codeId)

    const { data, count, error } = await query.range(from, to)
    if (error) return NextResponse.json({ message: error.message }, { status: 500 })

    return NextResponse.json({
      query: q,
      article_number: num,
      results: {
        data: data ?? [],
        current_page: page,
        last_page: Math.ceil((count ?? 0) / perPage) || 1,
        total: count ?? 0,
        per_page: perPage,
        from: from + 1,
        to: Math.min(from + perPage, count ?? 0),
      },
    })
  }

  // ── Recherche plein-texte (50 % threshold) ──────────────────────────────
  const words = q.split(/[\s,،.;:]+/).filter(w => w.length >= 2)
  if (!words.length) {
    return NextResponse.json({ message: 'أدخل كلمة بحث صالحة' }, { status: 422 })
  }

  const threshold = Math.ceil(words.length * 0.5)
  const orFilter = words.map(w => `content_ar.ilike.%${w}%`).join(',')

  let query = supabase
    .from('articles')
    .select(COLS)
    .or(orFilter)
    .order('view_count', { ascending: false })
    .limit(1000)

  if (codeId) query = query.eq('code_id', codeId)

  const { data: articles, error } = await query
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  const filtered = (articles ?? []).filter(a => {
    const content = a.content_ar?.toLowerCase() ?? ''
    return words.filter(w => content.includes(w.toLowerCase())).length >= threshold
  })

  const total = filtered.length
  const from = (page - 1) * perPage
  return NextResponse.json({
    query: q,
    results: {
      data: filtered.slice(from, from + perPage),
      current_page: page,
      last_page: Math.ceil(total / perPage) || 1,
      total,
      per_page: perPage,
      from: from + 1,
      to: Math.min(from + perPage, total),
    },
  })
}
