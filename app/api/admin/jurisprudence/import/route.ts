import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'
import { createServiceClient } from '@/lib/supabase/server'

// ── Helpers ───────────────────────────────────────────────────────────────────

const CHAMBER_MAP: Record<string, string> = {
  civil:          'civil',
  criminal:       'criminal',
  social:         'social',
  commercial:     'commercial',
  administrative: 'administrative',
}

const CODE_MAP: [RegExp, string][] = [
  [/مدونة\s*الشغل|قانون\s*الشغل/, 'مدونة-الشغل'],
  [/مدونة\s*الأسرة|الأحوال\s*الشخصية/, 'مدونة-الأسرة'],
  [/القانون\s*الجنائي|مجموعة\s*القانون\s*الجنائي/, 'القانون-الجنائي'],
  [/قانون\s*الالتزامات\s*والعقود/, 'قانون-الالتزامات-والعقود'],
  [/المسطرة\s*الجنائية|قانون\s*المسطرة\s*الجنائية/, 'المسطرة-الجنائية'],
  [/المسطرة\s*المدنية/, 'المسطرة-المدنية'],
  [/مدونة\s*التجارة/, 'مدونة-التجارة'],
]

function extractTags(subject: string) {
  const tags: { code_slug: string; article_number: string; display_label: string }[] = []
  if (!subject) return tags
  const RE = /(الفصل|المادة)\s+(\d+(?:\s*مكرر)?)\s+من\s+([؀-ۿ0-9\s.،]{3,40})/g
  let m: RegExpExecArray | null
  while ((m = RE.exec(subject)) !== null) {
    const articleNum  = m[2].replace(/\s+/g, '').trim()
    const rawCodeName = m[3].trim()
    let codeSlug = ''
    for (const [pattern, slug] of CODE_MAP) {
      if (pattern.test(rawCodeName)) { codeSlug = slug; break }
    }
    if (!codeSlug) continue
    const key = `${codeSlug}::${articleNum}`
    if (tags.some(t => `${t.code_slug}::${t.article_number}` === key)) continue
    tags.push({
      code_slug:      codeSlug,
      article_number: articleNum,
      display_label:  `م.${articleNum} — ${rawCodeName.slice(0, 18).trim()}`,
    })
  }
  return tags
}

// Robust CSV parser — handles quoted fields, multiline, BOM, \r\n and \n
function parseCSV(raw: string): Record<string, string>[] {
  // Remove BOM (U+FEFF) — use explicit unicode escape to avoid encoding issues
  const text = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw

  const results: Record<string, string>[] = []
  let headers: string[] = []
  let i = 0
  const len = text.length

  function parseRow(): string[] {
    const fields: string[] = []
    while (i < len) {
      if (text[i] === '"') {
        // Quoted field
        i++ // skip opening quote
        let val = ''
        while (i < len) {
          if (text[i] === '"' && text[i + 1] === '"') { val += '"'; i += 2 }
          else if (text[i] === '"') { i++; break }
          else { val += text[i++] }
        }
        fields.push(val)
        // skip comma or newline
        if (text[i] === ',') i++
        else if (text[i] === '\r') { i += text[i + 1] === '\n' ? 2 : 1; break }
        else if (text[i] === '\n') { i++; break }
      } else {
        // Unquoted field — read until comma or newline
        let val = ''
        while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
          val += text[i++]
        }
        fields.push(val)
        if (text[i] === ',') i++
        else if (text[i] === '\r') { i += text[i + 1] === '\n' ? 2 : 1; break }
        else if (text[i] === '\n') { i++; break }
        else break // EOF
      }
    }
    return fields
  }

  // First row = headers
  headers = parseRow().map(h => h.trim())

  while (i < len) {
    const fields = parseRow()
    if (fields.length === 0 || fields.every(f => !f.trim())) continue
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => { obj[h] = fields[idx] ?? '' })
    results.push(obj)
  }

  return results
}

// ── POST /api/admin/jurisprudence/import ──────────────────────────────────────
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  const batchTag = (formData.get('batch') as string | null) ?? new Date().toISOString().slice(0, 10)

  if (!file) return NextResponse.json({ message: 'CSV مطلوب' }, { status: 422 })

  const text = await file.text()
  const rows = parseCSV(text)

  // Debug: return early with parse info if rows = 0
  if (!rows.length) {
    const preview = text.slice(0, 200)
    return NextResponse.json({
      message: 'الملف فارغ أو بتنسيق غير صحيح',
      preview,
      firstCharCode: text.charCodeAt(0),
    }, { status: 422 })
  }

  // Validate that case_number column exists
  const sample = rows[0]
  const cols   = Object.keys(sample)
  if (!cols.includes('case_number')) {
    return NextResponse.json({
      message: `عمود case_number غير موجود — الأعمدة المكتشفة: ${cols.join(', ')}`,
    }, { status: 422 })
  }

  const supabase  = createServiceClient()
  let inserted    = 0
  let errors      = 0
  let tagsDone    = 0
  const BATCH     = 100

  // ── Phase 1 : upsert jurisprudence rows ──────────────────────────────────────
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)

    const records = chunk
      .filter(r => String(r.case_number ?? '').trim())
      .map(r => {
        const chamberRaw  = (r.chamber ?? '').toLowerCase().trim()
        const chamberSlug = CHAMBER_MAP[chamberRaw] ?? 'other'
        const subject     = (r.subject ?? '').replace(/\s+/g, ' ').trim()
        const pdfUrl      = (r.pdf_url ?? '').startsWith('https://') ? r.pdf_url.trim() : null

        return {
          case_number:     String(r.case_number).trim(),
          chamber:         chamberRaw || null,
          chamber_slug:    chamberSlug,
          decision_nature: (r.decision_nature ?? '').trim() || null,
          subject:         subject || null,
          subject_short:   subject.slice(0, 150) || null,
          decision_date:   (r.decision_date ?? '').trim() || null,
          pdf_url:         pdfUrl,
          import_batch:    batchTag,
          source:          'huquqai.ma',
        }
      })

    if (!records.length) continue

    const { data: upserted, error: upsertErr } = await supabase
      .from('jurisprudence')
      .upsert(records, { onConflict: 'case_number', ignoreDuplicates: false })
      .select('id, case_number, subject')

    if (upsertErr) {
      console.error('[import] upsert error:', upsertErr.message, upsertErr.code)
      errors += records.length
      // Return immediately with error details for debugging
      if (i === 0) {
        return NextResponse.json({
          message: upsertErr.message,
          code:    upsertErr.code,
          hint:    upsertErr.hint ?? null,
          sample:  records[0],
        }, { status: 500 })
      }
      continue
    }

    inserted += (upserted ?? []).length

    // ── Phase 2 : extract & insert tags for this batch ────────────────────────
    const tagRecords: any[] = []
    for (const row of upserted ?? []) {
      const tags = extractTags(row.subject ?? '')
      for (const t of tags) {
        tagRecords.push({
          jurisprudence_id:  row.id,
          article_id:        null,   // filled by a separate enrichment pass
          code_slug:         t.code_slug,
          article_number:    t.article_number,
          display_label:     t.display_label,
          extraction_method: 'regex',
          confidence:        1.0,
        })
      }
    }

    if (tagRecords.length) {
      const { error: tagErr, data: tagData } = await supabase
        .from('jurisprudence_tags')
        .upsert(tagRecords, { onConflict: 'jurisprudence_id,code_slug,article_number', ignoreDuplicates: true })
        .select('id')
      if (!tagErr) tagsDone += (tagData ?? []).length
    }
  }

  return NextResponse.json({
    ok:       true,
    total:    rows.filter(r => String(r.case_number ?? '').trim()).length,
    inserted,
    errors,
    tags:     tagsDone,
    batch:    batchTag,
    columns:  cols,   // debug: show detected column names
  })
}
