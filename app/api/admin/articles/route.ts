import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, paginationRange, paginatedResponse, slugify } from '@/lib/supabase/helpers'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const { searchParams } = new URL(req.url)
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const perPage = 50
  const q       = searchParams.get('q')
  const codeSlug = searchParams.get('code')
  const status  = searchParams.get('status')
  const { from, to } = paginationRange(page, perPage)

  let codeId: string | null = null
  if (codeSlug) {
    const { data: code } = await supabase.from('codes').select('id').eq('slug', codeSlug).single()
    codeId = code?.id ?? null
  }

  let query = supabase
    .from('articles')
    .select('id, code_id, number, number_int, slug, status, view_count, comment_count, created_at, code:codes(id, slug, title_ar)', { count: 'exact' })

  if (q)      query = query.or(`number.ilike.%${q}%,content_ar.ilike.%${q}%`)
  if (codeId) query = query.eq('code_id', codeId)
  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
    .order('code_id').order('number_int', { nullsFirst: false }).order('number')
    .range(from, to)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json(paginatedResponse(data ?? [], count ?? 0, page, perPage))
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const body = await req.json()
  const { code_id, number, content_ar, content_fr, status } = body

  if (!code_id || !number || !content_ar) {
    return NextResponse.json({ message: 'code_id, number, content_ar مطلوبة' }, { status: 422 })
  }

  const { data: code } = await supabase.from('codes').select('id, slug').eq('id', code_id).single()
  if (!code) return NextResponse.json({ message: 'القانون غير موجود' }, { status: 404 })

  const { data: existing } = await supabase
    .from('articles')
    .select('id')
    .eq('code_id', code_id)
    .eq('number', number)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ message: 'هذا الرقم موجود بالفعل في هذا القانون', errors: { number: [`الرقم ${number} موجود مسبقاً`] } }, { status: 422 })
  }

  let slug = `${code.slug}-${slugify(number)}`
  const { data: slugConflict } = await supabase.from('articles').select('id').eq('slug', slug).maybeSingle()
  if (slugConflict) slug = slug + '-' + Date.now()

  const { data: article, error } = await supabase
    .from('articles')
    .insert({
      code_id,
      number,
      number_int: parseInt(number) || null,
      content_ar,
      content_fr: content_fr ?? null,
      status: status ?? 'in_force',
      slug,
    })
    .select('*, code:codes(id, slug, title_ar)')
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  await supabase.from('codes').update({ total_articles: (code as any).total_articles ?? 0 + 1 }).eq('id', code_id)

  return NextResponse.json({ message: 'تمت إضافة المادة', article }, { status: 201 })
}
