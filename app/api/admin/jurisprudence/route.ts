import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, paginationRange, paginatedResponse } from '@/lib/supabase/helpers'
import { createServiceClient } from '@/lib/supabase/server'

// ── GET /api/admin/jurisprudence ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const { searchParams } = new URL(req.url)
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const perPage = 20
  const q       = searchParams.get('q') ?? ''

  const { from, to } = paginationRange(page, perPage)

  let query = supabase
    .from('jurisprudence')
    .select(
      'id, case_number, file_number, decision_date, case_type, result, pdf_url, import_batch, created_at',
      { count: 'exact' }
    )

  if (q) query = query.or(`case_number.ilike.%${q}%,file_number.ilike.%${q}%,subject.ilike.%${q}%`)

  const { data, count, error } = await query
    .order('decision_date', { ascending: false })
    .range(from, to)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json(paginatedResponse(data ?? [], count ?? 0, page, perPage))
}

// ── POST /api/admin/jurisprudence ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const supabase = createServiceClient()
  const body     = await req.json()

  const { case_number, file_number, decision_date, case_type, subject, result, pdf_url } = body

  if (!case_number) return NextResponse.json({ message: 'رقم القرار مطلوب' }, { status: 422 })
  if (!file_number)  return NextResponse.json({ message: 'رقم الملف مطلوب' }, { status: 422 })

  const { data, error } = await supabase
    .from('jurisprudence')
    .insert({
      case_number:   String(case_number).trim(),
      file_number:   String(file_number).trim(),
      decision_date: decision_date || null,
      case_type:     case_type || null,
      subject:       subject   || null,
      result:        result    || null,
      pdf_url:       pdf_url   || null,
      import_batch:  'manual',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ message: 'تمت الإضافة', decision: data }, { status: 201 })
}
