import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'
import { createServiceClient } from '@/lib/supabase/server'

// ── PUT /api/admin/jurisprudence/[id] ─────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  const supabase = createServiceClient()
  const body = await req.json()

  const { case_number, chamber, chamber_slug, decision_nature, subject,
          decision_date, pdf_url, keywords, summary_ar } = body

  const subject_short = subject ? subject.slice(0, 150).trim() : undefined

  const updateData: Record<string, any> = {}
  if (case_number    !== undefined) updateData.case_number    = String(case_number).trim()
  if (chamber        !== undefined) updateData.chamber        = chamber || null
  if (chamber_slug   !== undefined) updateData.chamber_slug   = chamber_slug || null
  if (decision_nature !== undefined) updateData.decision_nature = decision_nature || null
  if (subject        !== undefined) { updateData.subject = subject || null; updateData.subject_short = subject_short || null }
  if (decision_date  !== undefined) updateData.decision_date  = decision_date || null
  if (pdf_url        !== undefined) updateData.pdf_url        = pdf_url || null
  if (keywords       !== undefined) updateData.keywords       = keywords?.length ? keywords : null
  if (summary_ar     !== undefined) updateData.summary_ar     = summary_ar || null
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('jurisprudence')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ message: 'تم التحديث', decision: data })
}

// ── DELETE /api/admin/jurisprudence/[id] ──────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('jurisprudence')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ message: 'تم الحذف' })
}
