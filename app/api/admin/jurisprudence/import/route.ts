// POST /api/admin/jurisprudence/import
// Accepts: multipart/form-data  { file: .xlsx, batch?: string }
// Parses Excel file and upserts into jurisprudence table (conflict on file_number)

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'
import { createServiceClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

type JurisRecord = {
  case_number:   string
  file_number:   string
  decision_date: string | null
  case_type:     string | null
  subject:       string | null
  result:        string | null
  pdf_url:       string | null
  import_batch:  string
}

function formatDate(val: unknown): string | null {
  if (!val) return null
  if (typeof val === 'string') {
    const t = val.trim()
    return /^\d{4}-\d{2}-\d{2}/.test(t) ? t.slice(0, 10) : null
  }
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val)
    if (!d) return null
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
  }
  return null
}

// Column names from the Excel file
const COL_CASE    = 'رقم القرار'           // رقم القرار
const COL_FILE    = 'رقم الملف'                  // رقم الملف
const COL_DATE    = 'تاريخ القرار' // تاريخ القرار
const COL_TYPE    = 'نوع القضية'            // نوع القضية
const COL_SUBJECT = 'الموضوع - القاعدة' // الموضوع - القاعدة
const COL_RESULT  = 'النتيجة'                         // النتيجة
const COL_URL     = 'الرابط'                               // الرابط

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  const batchTag = (formData.get('batch') as string | null) ?? new Date().toISOString().slice(0, 10)

  if (!file)
    return NextResponse.json({ message: 'ملف Excel مطلوب' }, { status: 422 })
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls'))
    return NextResponse.json({ message: 'يجب أن يكون الملف بتنسيق .xlsx' }, { status: 422 })

  // Parse Excel
  const buffer   = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(
    workbook.Sheets[workbook.SheetNames[0]],
    { defval: null }
  )

  if (!rows.length)
    return NextResponse.json({ message: 'الملف فارغ أو لا يحتوي على بيانات' }, { status: 422 })

  // Validate that mandatory columns are present
  const excelCols  = Object.keys(rows[0])
  const hasCaseCol = excelCols.includes(COL_CASE)
  const hasFileCol = excelCols.includes(COL_FILE)
  if (!hasCaseCol || !hasFileCol) {
    return NextResponse.json({
      message: 'أعمدة مفقودة: رقم القرار و/أو رقم الملف',
      found:   excelCols,
    }, { status: 422 })
  }

  // Map rows to DB records
  const records: JurisRecord[] = rows.reduce<JurisRecord[]>((acc, r) => {
    const file_number = String(r[COL_FILE]    ?? '').trim()
    const case_number = String(r[COL_CASE]    ?? '').trim()
    if (!file_number || !case_number) return acc
    acc.push({
      case_number,
      file_number,
      decision_date: formatDate(r[COL_DATE]),
      case_type:     String(r[COL_TYPE]    ?? '').trim()                              || null,
      subject:       String(r[COL_SUBJECT] ?? '').replace(/\s+/g, ' ').trim()         || null,
      result:        String(r[COL_RESULT]  ?? '').trim()                              || null,
      pdf_url:       String(r[COL_URL]     ?? '').startsWith('http')
                       ? String(r[COL_URL]).trim() : null,
      import_batch:  batchTag,
    })
    return acc
  }, [])

  if (!records.length)
    return NextResponse.json({ message: 'لا توجد صفوف صالحة (file_number وcase_number مطلوبان)' }, { status: 422 })

  // Upsert in batches of 100
  const supabase = createServiceClient()
  let inserted   = 0
  let errors     = 0
  const BATCH    = 100

  for (let i = 0; i < records.length; i += BATCH) {
    const chunk = records.slice(i, i + BATCH)
    const { data: upserted, error: upsertErr } = await supabase
      .from('jurisprudence')
      .upsert(chunk, { onConflict: 'file_number', ignoreDuplicates: false })
      .select('id')

    if (upsertErr) {
      console.error('[import] upsert error:', upsertErr.message)
      errors += chunk.length
      if (i === 0) {
        return NextResponse.json({
          message: upsertErr.message,
          code:    upsertErr.code,
          hint:    upsertErr.hint ?? null,
          sample:  chunk[0],
        }, { status: 500 })
      }
      continue
    }
    inserted += (upserted ?? []).length
  }

  return NextResponse.json({ ok: true, total: records.length, inserted, errors, batch: batchTag })
}
