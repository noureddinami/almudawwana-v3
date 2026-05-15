import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, paginationRange, paginatedResponse, uniqueSlug } from '@/lib/supabase/helpers'

const VALID_TYPES = ['constitution','organic_law','ordinary_law','code','decree_law','decree','order','circular','international_treaty']
const VALID_STATUS = ['in_force','abrogated','amended','draft']

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const { searchParams } = new URL(req.url)
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const perPage = 20
  const q       = searchParams.get('q')
  const status  = searchParams.get('status')

  const { from, to } = paginationRange(page, perPage)

  let query = supabase
    .from('codes')
    .select('id, slug, title_ar, title_fr, type, status, official_number, total_articles, promulgation_date, created_at', { count: 'exact' })

  if (q)      query = query.or(`title_ar.ilike.%${q}%,title_fr.ilike.%${q}%`)
  if (status) query = query.eq('status', status)

  const { data, count, error } = await query.order('title_ar').range(from, to)
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json(paginatedResponse(data ?? [], count ?? 0, page, perPage))
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const body = await req.json()
  const { title_ar, title_fr, type, official_number, promulgation_date, status, source_url } = body

  if (!title_ar) return NextResponse.json({ message: 'العنوان بالعربية مطلوب' }, { status: 422 })
  if (!VALID_TYPES.includes(type)) return NextResponse.json({ message: 'نوع القانون غير صالح' }, { status: 422 })

  const slug = await uniqueSlug(supabase, 'codes', title_fr ?? title_ar)

  const { data, error } = await supabase
    .from('codes')
    .insert({ title_ar, title_fr, type, official_number, promulgation_date, status: status ?? 'in_force', source_url, slug })
    .select()
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ message: 'تم إنشاء القانون', code: data }, { status: 201 })
}
