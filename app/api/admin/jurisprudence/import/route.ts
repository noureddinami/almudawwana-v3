import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'
import { createServiceClient } from '@/lib/supabase/server'

// ── Helpers ───────────────────────────────────────────────────────────────────

const CHAMBER_MAP: Record<string, { slug: string; ar: string }> = {
  civil:          { slug: 'civil',          ar: 'الغرفة المدنية'        },
  criminal:       { slug: 'criminal',       ar: 'الغرفة الجنائية'       },
  social:         { slug: 'social',         ar: 'الغرفة الاجتماعية'     },
  commercial:     { slug: 'commercial',     ar: 'الغرفة التجارية'       },
  administrative: { slug: 'administrative', ar: 'الغرفة الإدارية'       },
  '':             { slug: 'other',          ar: 'غير محدد'              },
}

// Code name fragments → slug
const CODE_MAP: [RegExp, string][] = [
  [/مدونة\s*الشغل|قانون\s*الشغل/,                        'مدونة-الشغل'],
  [/مدونة\s*الأسرة|الأحوال\s*الشخصية/,                   'مدونة-الأسرة'],
  [/القانون\s*الجنائي|مجموعة\s*القانون\s*الجنائي|ق\.ج/,  'القانون-الجنائي'],
  [/قانون\s*الالتزامات\s*والعقود|ق\.ل\.ع/,               'قانون-الالتزامات-والعقود'],
  [/المسطرة\s*الجنائية|قانون\s*المسطرة\s*الجنائية|م\.ج/, 'المسطرة-الجنائية'],
  [/المسطرة\s*المدنية/,                                   'المسطرة-المدنية'],
  [/مدونة\s*التجارة/,                                     'مدونة-التجارة'],
]

const NOISE_PATTERNS = [
  /صدر القرار وتلي بالجلسة العلنية المنعقدة بالتاريخ المذكور أعلاه بقاعة الجلسات[^\n]*/g,
  /صدر القرار وتلي بالجلسة العلنية[^\n]*/g,
  /بقاعة الجلسات[^\n]*/g,
]

function normalizeSubject(raw: string): string {
  let s = raw ?? ''
  for (const p of NOISE_PATTERNS) s = s.replace(p, '')
  return s.replace(/\s+/g, ' ').trim()
}

function extractTags(subject: string) {
  const tags: { code_slug: string; article_number: string; display_label: string }[] = []
  if (!subject) return tags

  // Pattern: (الفصل|المادة) <number> من <code name>
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

    // Deduplicate
    const key = `${codeSlug}::${articleNum}`
    if (tags.some(t => `${t.code_slug}::${t.article_number}` === key)) continue

    const shortCode = codeSlug.split('-')[0] === 'مدونة'
      ? `م.${articleNum} — ${rawCodeName.slice(0, 20).trim()}`
      : `م.${articleNum} — ${rawCodeName.slice(0, 20).trim()}`

    tags.push({ code_slug: codeSlug, article_number: articleNum, display_label: shortCode })
  }

  return tags
}

// Simple CSV parser that handles quoted multi-line fields
function parseCSV(text: string): Record<string, string>[] {
  const rows: Record<string, string>[] = []
  // Remove BOM
  const clean = text.replace(/^﻿/, '')

  // State-machine CSV parse
  let inQuote = false
  let field   = ''
  let row: string[] = []
  let headers: string[] = []
  let isFirstRow = true

  const pushField = () => { row.push(field); field = '' }

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    const next = clean[i + 1]

    if (inQuote) {
      if (ch === '"' && next === '"') { field += '"'; i++ }
      else if (ch === '"') { inQuote = false }
      else { field += ch }
    } else {
      if (ch === '"') { inQuote = true }
      else if (ch === ',') { pushField() }
      else if (ch === '\r' && next === '\n') { pushField(); if (isFirstRow) { headers = row; isFirstRow = false } else { const obj: Record<string, string> = {}; headers.forEach((h, idx) => { obj[h] = row[idx] ?? '' }); rows.push(obj) }; row = []; i++ }
      else if (ch === '\n') { pushField(); if (isFirstRow) { headers = row; isFirstRow = false } else { const obj: Record<string, string> = {}; headers.forEach((h, idx) => { obj[h] = row[idx] ?? '' }); rows.push(obj) }; row = [] }
      else { field += ch }
    }
  }
  // Last row
  if (field || row.length) {
    pushField()
    if (!isFirstRow && row.some(f => f.trim())) {
      const obj: Record<string, string> = {}
      headers.forEach((h, idx) => { obj[h] = row[idx] ?? '' })
      rows.push(obj)
    }
  }
  return rows
}

// ── POST /api/admin/jurisprudence/import ──────────────────────────────────────
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  const batchTag = (formData.get('batch') as string | null) ?? new Date().toISOString().slice(0, 10)
  const resetStr = formData.get('reset') as string | null
  const doReset  = resetStr === 'true' || resetStr === '1'

  if (!file) return NextResponse.json({ message: 'CSV مطلوب' }, { status: 422 })
  if (!file.name.endsWith('.csv'))
    return NextResponse.json({ message: 'الملف يجب أن يكون بصيغة .csv' }, { status: 422 })

  const text = await file.text()
  const rows = parseCSV(text)

  if (!rows.length)
    return NextResponse.json({ message: 'الملف فارغ أو بتنسيق غير صحيح' }, { status: 422 })

  const supabase = createServiceClient()

  // Optionally clear table before re-import
  if (doReset) {
    const { error: delErr } = await supabase
      .from('jurisprudence')
      .delete()
      .eq('import_batch', batchTag)
    if (delErr) console.warn('[import] reset error:', delErr.message)
  }

  // Lookup article_id cache: code_slug+article_number → UUID
  const articleCache: Record<string, string | null> = {}

  async function lookupArticle(codeSlug: string, number: string): Promise<string | null> {
    const key = `${codeSlug}::${number}`
    if (key in articleCache) return articleCache[key]
    const { data } = await supabase
      .from('articles')
      .select('id, code:codes!inner(slug)')
      .eq('number', number)
      .eq('codes.slug', codeSlug)
      .maybeSingle()
    const id = (data as any)?.id ?? null
    articleCache[key] = id
    return id
  }

  let inserted = 0
  let updated  = 0
  let errors   = 0
  let tagsDone = 0

  const BATCH = 50

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)

    const records = chunk.map(r => {
      const chamberRaw = (r.chamber ?? '').toLowerCase().trim()
      const chamberInfo = CHAMBER_MAP[chamberRaw] ?? CHAMBER_MAP['']
      const subject     = normalizeSubject(r.subject ?? '')
      const subject_short = subject.slice(0, 150)
      const pdfUrl      = (r.pdf_url ?? '').startsWith('https://') ? r.pdf_url.trim() : null

      return {
        case_number:    String(r.case_number ?? '').trim(),
        chamber:        chamberRaw || null,
        chamber_slug:   chamberInfo.slug,
        decision_nature: (r.decision_nature ?? '').trim() || null,
        subject:        subject || null,
        subject_short:  subject_short || null,
        decision_date:  (r.decision_date ?? '').trim() || null,
        pdf_url:        pdfUrl,
        import_batch:   batchTag,
        source:         'huquqai.ma',
      }
    }).filter(r => r.case_number)

    if (!records.length) continue

    const { data: upserted, error: upsertErr } = await supabase
      .from('jurisprudence')
      .upsert(records, { onConflict: 'case_number', ignoreDuplicates: false })
      .select('id, case_number, subject')

    if (upsertErr) {
      console.error('[import] upsert error:', upsertErr.message)
      errors += chunk.length
      continue
    }

    inserted += (upserted ?? []).length

    // Process tags for each upserted record
    for (const row of upserted ?? []) {
      const rawSubject = chunk.find(c => String(c.case_number ?? '').trim() === row.case_number)?.subject ?? ''
      const tags = extractTags(normalizeSubject(rawSubject))
      if (!tags.length) continue

      // Delete old tags for this jurisprudence to re-insert
      await supabase.from('jurisprudence_tags').delete().eq('jurisprudence_id', row.id)

      const tagRows = await Promise.all(tags.map(async t => {
        const articleId = await lookupArticle(t.code_slug, t.article_number)
        return {
          jurisprudence_id:  row.id,
          article_id:        articleId,
          code_slug:         t.code_slug,
          article_number:    t.article_number,
          display_label:     t.display_label,
          extraction_method: 'regex',
          confidence:        1.0,
        }
      }))

      const { error: tagErr } = await supabase.from('jurisprudence_tags').insert(tagRows)
      if (!tagErr) tagsDone += tagRows.length
    }
  }

  return NextResponse.json({
    ok:       true,
    total:    rows.filter(r => (r.case_number ?? '').trim()).length,
    inserted,
    errors,
    tags:     tagsDone,
    batch:    batchTag,
  })
}
