import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult
  const { id } = await params

  const { data, error } = await supabase
    .from('pdf_documents')
    .select('*, code:codes(id, slug, title_ar), uploader:profiles!uploaded_by(id, full_name)')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ message: 'الملف غير موجود' }, { status: 404 })

  const service = createServiceClient()
  const { data: urlData } = service.storage.from('pdfs').getPublicUrl(data.stored_filename)

  return NextResponse.json({ pdf: data, download_url: urlData.publicUrl, file_size: data.file_size })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult
  const { id } = await params

  const body = await req.json()
  const allowed = ['title_ar','title_fr','code_id','is_public']
  const data = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const { data: pdf, error } = await supabase
    .from('pdf_documents')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ message: 'تم التحديث', pdf })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult
  const { id } = await params

  const { data: pdf } = await supabase
    .from('pdf_documents')
    .select('stored_filename')
    .eq('id', id)
    .single()

  if (pdf) {
    const service = createServiceClient()
    await service.storage.from('pdfs').remove([pdf.stored_filename])
  }

  await supabase.from('pdf_documents').delete().eq('id', id)
  return NextResponse.json({ message: 'تم حذف الملف' })
}
