import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult
  const { id } = await params

  const { data: pdfDoc } = await supabase
    .from('pdf_documents')
    .select('stored_filename')
    .eq('id', id)
    .single()

  if (!pdfDoc) return NextResponse.json({ message: 'الملف غير موجود' }, { status: 404 })

  const service = createServiceClient()
  const { data: fileData, error } = await service.storage
    .from('pdfs')
    .download(pdfDoc.stored_filename)

  if (error || !fileData) return NextResponse.json({ message: 'فشل تحميل الملف' }, { status: 500 })

  let text = ''
  try {
    const pdfParse = (await import('pdf-parse')).default
    const buffer   = Buffer.from(await fileData.arrayBuffer())
    text           = (await pdfParse(buffer)).text
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }

  const articles: { type: string; number: string; content_ar: string }[] = []
  const lines = text.split('\n')
  let currentType = 'المادة', currentNumber = '', currentContent: string[] = []

  for (const line of lines) {
    const match = line.match(/^\s*(الفصل|المادة|البند)\s+(\d+(?:[.\-–]\d+)?(?:\s*مكرر)?)\s*$/u)
    if (match) {
      if (currentNumber) articles.push({ type: currentType, number: currentNumber, content_ar: currentContent.join('\n').trim() })
      currentType    = match[1]
      currentNumber  = match[2].trim()
      currentContent = []
    } else if (currentNumber) {
      currentContent.push(line)
    }
  }
  if (currentNumber) articles.push({ type: currentType, number: currentNumber, content_ar: currentContent.join('\n').trim() })

  return NextResponse.json({
    detected:    articles.length,
    sample:      articles.slice(0, 5),
    all_numbers: articles.map(a => a.number),
  })
}
