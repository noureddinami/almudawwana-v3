import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, paginationRange, paginatedResponse } from '@/lib/supabase/helpers'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const page = Math.max(1, parseInt(new URL(req.url).searchParams.get('page') ?? '1'))
  const { from, to } = paginationRange(page, 20)

  const { data, count, error } = await supabase
    .from('pdf_documents')
    .select('*, code:codes(id, slug, title_ar), uploader:profiles!uploaded_by(id, full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json(paginatedResponse(data ?? [], count ?? 0, page, 20))
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { userId } = authResult

  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  const title_ar = formData.get('title_ar') as string
  const title_fr = formData.get('title_fr') as string | null
  const code_id  = formData.get('code_id') as string | null
  const document_type = (formData.get('document_type') as string) ?? 'code'

  if (!file || !title_ar) {
    return NextResponse.json({ message: 'الملف والعنوان مطلوبان' }, { status: 422 })
  }

  const allowedTypes: Record<string, string> = {
    'application/pdf': 'application/pdf',
    'text/plain':      'text/plain',
    'text/markdown':   'text/markdown',
    'text/x-markdown': 'text/markdown',
  }
  const ext = file.name.split('.').pop()?.toLowerCase()
  const isTextFile = ext === 'txt' || ext === 'md'
  const contentType = allowedTypes[file.type] ?? (isTextFile ? 'text/plain' : null)

  if (!contentType) {
    return NextResponse.json({ message: 'يُقبل PDF أو TXT أو MD فقط' }, { status: 422 })
  }

  const serviceClient = createServiceClient()

  const storedFilename = `pdfs/${Date.now()}-${file.name.replace(/\s+/g, '_')}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await serviceClient.storage
    .from('pdfs')
    .upload(storedFilename, buffer, { contentType, upsert: false })

  if (uploadError) return NextResponse.json({ message: uploadError.message }, { status: 500 })

  const { data: pdf, error: dbError } = await serviceClient
    .from('pdf_documents')
    .insert({
      title_ar,
      title_fr:          title_fr ?? null,
      code_id:           code_id ?? null,
      uploaded_by:       userId,
      original_filename: file.name,
      stored_filename:   storedFilename,
      file_size:         file.size,
      document_type,
      status:            'pending',
    })
    .select('*, code:codes(id, slug, title_ar)')
    .single()

  if (dbError) return NextResponse.json({ message: dbError.message }, { status: 500 })

  const { data: urlData } = serviceClient.storage.from('pdfs').getPublicUrl(storedFilename)

  return NextResponse.json({ message: 'تم رفع الملف', pdf, download_url: urlData.publicUrl }, { status: 201 })
}
