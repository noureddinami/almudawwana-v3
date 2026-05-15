import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paginationRange, paginatedResponse } from '@/lib/supabase/helpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient()
  const { slug } = await params
  const { searchParams } = new URL(req.url)
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const perPage = Math.min(200, parseInt(searchParams.get('per_page') ?? '50'))

  const { data: code } = await supabase
    .from('codes')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!code) return NextResponse.json({ message: 'القانون غير موجود' }, { status: 404 })

  const { from, to } = paginationRange(page, perPage)

  const { data, count, error } = await supabase
    .from('articles')
    .select(
      'id, code_id, section_id, number, number_int, slug, content_ar, status, view_count, comment_count, section:sections(id, title_ar, number)',
      { count: 'exact' }
    )
    .eq('code_id', code.id)
    .eq('status', 'in_force')
    // Tri naturel : number_int d'abord, puis alphabétique sur number
    .order('number_int', { ascending: true, nullsFirst: false })
    .order('number', { ascending: true })
    .range(from, to)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json(paginatedResponse(data ?? [], count ?? 0, page, perPage))
}
