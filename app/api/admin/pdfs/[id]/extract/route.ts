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
    .select('*, code:codes(id, slug)')
    .eq('id', id)
    .single()

  if (!pdfDoc) return NextResponse.json({ message: 'الملف غير موجود' }, { status: 404 })
  if (!pdfDoc.code_id) return NextResponse.json({ message: 'يجب تحديد القانون المرتبط أولاً' }, { status: 422 })

  await supabase.from('pdf_documents').update({ status: 'processing' }).eq('id', id)

  // Télécharger le PDF depuis Supabase Storage
  const service = createServiceClient()
  const { data: fileData, error: dlError } = await service.storage
    .from('pdfs')
    .download(pdfDoc.stored_filename)

  if (dlError || !fileData) {
    await supabase.from('pdf_documents').update({ status: 'failed', extraction_log: dlError?.message }).eq('id', id)
    return NextResponse.json({ message: 'فشل تحميل الملف من التخزين' }, { status: 500 })
  }

  // Extraction du texte selon le type de fichier
  let text = ''
  const filename = pdfDoc.stored_filename as string
  const ext = filename.split('.').pop()?.toLowerCase()

  try {
    const buffer = Buffer.from(await fileData.arrayBuffer())
    if (ext === 'txt' || ext === 'md') {
      text = buffer.toString('utf-8')
    } else {
      const pdfParse = (await import('pdf-parse')).default
      const parsed   = await pdfParse(buffer)
      text           = parsed.text
    }
  } catch (e: any) {
    await supabase.from('pdf_documents').update({ status: 'failed', extraction_log: e.message }).eq('id', id)
    return NextResponse.json({ message: 'فشل تحليل الملف' }, { status: 500 })
  }

  // Détection des articles (pattern : الفصل X ou المادة X)
  const articlePattern = /(?:^|\n)\s*(?:الفصل|المادة|البند)\s+(\d+(?:[.\-–]\d+)?(?:\s*مكرر)?)\s*[\n:]/gmu
  const articles: { number: string; content_ar: string }[] = []
  const lines = text.split('\n')

  let currentNumber = ''
  let currentContent: string[] = []

  for (const line of lines) {
    const match = line.match(/^\s*(?:الفصل|المادة|البند)\s+(\d+(?:[.\-–]\d+)?(?:\s*مكرر)?)\s*$/u)
    if (match) {
      if (currentNumber && currentContent.length) {
        articles.push({ number: currentNumber, content_ar: currentContent.join('\n').trim() })
      }
      currentNumber  = match[1].trim()
      currentContent = []
    } else if (currentNumber) {
      currentContent.push(line)
    }
  }
  if (currentNumber && currentContent.length) {
    articles.push({ number: currentNumber, content_ar: currentContent.join('\n').trim() })
  }

  // Insérer les articles
  let imported = 0
  const log: string[] = []

  for (const art of articles) {
    const slug = `${pdfDoc.code_id}-${art.number.replace(/\s+/g, '-')}`
    const { error } = await supabase.from('articles').upsert({
      code_id:    pdfDoc.code_id,
      number:     art.number,
      number_int: parseInt(art.number) || null,
      content_ar: art.content_ar,
      status:     'draft',
      slug,
    })
    if (error) { log.push(`❌ المادة ${art.number}: ${error.message}`) }
    else        { imported++; log.push(`✅ المادة ${art.number}`) }
  }

  await supabase.from('pdf_documents').update({
    status:            'imported',
    articles_extracted: imported,
    extraction_log:    log.join('\n'),
  }).eq('id', id)

  return NextResponse.json({
    message:           `تم استخراج ${imported} مادة من ${articles.length} مكتشفة`,
    articles_detected: articles.length,
    articles_imported: imported,
    log:               log.join('\n'),
  })
}
