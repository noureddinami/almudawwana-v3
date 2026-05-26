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
  const chamber = searchParams.get('chamber') ?? ''

  const { from, to } = paginationRange(page, perPage)

  let query = supabase
    .from('jurisprudence')
    .select('id, case_number, chamber, chamber_slug, decision_nature, subject_short, decision_date, pdf_url, import_batch, created_at', { count: 'exact' })

  if (chamber) query = query.eq('chamber_slug', chamber)
  if (q)       query = query.or(`case_number.ilike.%${q}%,subject.ilike.%${q}%,subject_short.ilike.%${q}%`)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json(paginatedResponse(data ?? [], count ?? 0, page, perPage))
}

// ── POST /api/admin/jurisprudence ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const supabase = createServiceClient()
  const body = await req.json()

  const { case_number, chamber, chamber_slug, decision_nature, subject,
          decision_date, pdf_url, keywords, summary_ar } = body

  if (!case_number) return NextResponse.json({ message: 'رقم الملف مطلوب' }, { status: 422 })

  const subject_short = (subject ?? '').slice(0, 150).trim()

  const { data, error } = await supabase
    .from('jurisprudence')
    .insert({
      case_number: String(case_number).trim(),
      chamber:       chamber || null,
      chamber_slug:  chamber_slug || null,
      decision_nature: decision_nature || null,
      subject:       subject || null,
      subject_short: subject_short || null,
      decision_date: decision_date || null,
      pdf_url:       pdf_url || null,
      keywords:      keywords?.length ? keywords : null,
      summary_ar:    summary_ar || null,
      import_batch:  new Date().toISOString().slice(0, 10),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ message: 'تمت الإضافة', decision: data }, { status: 201 })
}
