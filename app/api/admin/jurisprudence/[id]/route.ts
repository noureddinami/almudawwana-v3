import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'
import { createServiceClient } from '@/lib/supabase/server'

// ── PUT /api/admin/jurisprudence/[id] ─────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const { id }    = await params
  const supabase  = createServiceClient()
  const body      = await req.json()
  const { case_number, file_number, decision_date, case_type, subject, result, pdf_url } = body

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (case_number  !== undefined) update.case_number  = String(case_number).trim()
  if (file_number  !== undefined) update.file_number  = String(file_number).trim()
  if (decision_date !== undefined) update.decision_date = decision_date || null
  if (case_type    !== undefined) update.case_type    = case_type  || null
  if (subject      !== undefined) update.subject      = subject    || null
  if (result       !== undefined) update.result       = result     || null
  if (pdf_url      !== undefined) update.pdf_url      = pdf_url    || null

  const { data, error } = await supabase
    .from('jurisprudence')
    .update(update)
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

  const { id }   = await params
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('jurisprudence')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ message: 'تم الحذف' })
}
