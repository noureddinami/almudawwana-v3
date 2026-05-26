// ── lib/jurisprudence.ts ──────────────────────────────────────────────────────
// Fonctions de lecture publique (SSR + client) — utilise createPublicClient()

import { createPublicClient } from './supabase/server'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface JurisTag {
  id:             string
  code_slug:      string
  article_number: string
  display_label:  string
  article_id:     string | null
}

export interface Decision {
  id:              string
  case_number:     string
  chamber:         string | null
  chamber_slug:    string | null
  decision_nature: string | null
  subject:         string | null
  subject_short:   string | null
  decision_date:   string | null
  pdf_url:         string | null
  keywords:        string[] | null
  summary_ar:      string | null
  source:          string
  created_at:      string
  tags?:           JurisTag[]
}

export interface DecisionsPage {
  data:         Decision[]
  total:        number
  current_page: number
  last_page:    number
  per_page:     number
}

// Chamber display labels
export const CHAMBER_LABELS: Record<string, string> = {
  civil:          'الغرفة المدنية',
  criminal:       'الغرفة الجنائية',
  social:         'الغرفة الاجتماعية',
  commercial:     'الغرفة التجارية',
  administrative: 'الغرفة الإدارية',
  other:          'غير محدد',
}

// Chamber badge colors
export const CHAMBER_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  civil:          { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   bar: 'bg-blue-500'   },
  criminal:       { bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200',    bar: 'bg-red-500'    },
  social:         { bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200',  bar: 'bg-green-500'  },
  commercial:     { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  bar: 'bg-amber-500'  },
  administrative: { bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200', bar: 'bg-purple-500' },
  other:          { bg: 'bg-slate-50',   text: 'text-slate-600',  border: 'border-slate-200',  bar: 'bg-slate-400'  },
}

export function chamberColor(slug: string | null) {
  return CHAMBER_COLORS[slug ?? ''] ?? CHAMBER_COLORS.other
}

// ── Public API functions ──────────────────────────────────────────────────────

export async function getDecisions(params: {
  page?:    number
  limit?:   number
  chamber?: string
  search?:  string
  year?:    number
} = {}): Promise<DecisionsPage> {
  const supabase = createPublicClient()
  const page     = Math.max(1, params.page ?? 1)
  const perPage  = params.limit ?? 20
  const from     = (page - 1) * perPage
  const to       = from + perPage - 1

  let query = supabase
    .from('jurisprudence')
    .select(`
      id, case_number, chamber, chamber_slug, decision_nature,
      subject_short, decision_date, pdf_url, source, created_at,
      tags:jurisprudence_tags(id, code_slug, article_number, display_label, article_id)
    `, { count: 'exact' })

  if (params.chamber) query = query.eq('chamber_slug', params.chamber)
  if (params.year)    query = query.gte('decision_date', `${params.year}-01-01`)
                                   .lte('decision_date', `${params.year}-12-31`)
  if (params.search)  query = query.or(
    `case_number.ilike.%${params.search}%,subject.ilike.%${params.search}%,subject_short.ilike.%${params.search}%`
  )

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) { console.error('[getDecisions]', error.message); return { data: [], total: 0, current_page: page, last_page: 1, per_page: perPage } }

  const total    = count ?? 0
  const lastPage = Math.ceil(total / perPage) || 1

  return {
    data:         (data ?? []) as Decision[],
    total,
    current_page: page,
    last_page:    lastPage,
    per_page:     perPage,
  }
}

export async function getDecision(id: string): Promise<Decision | null> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('jurisprudence')
    .select(`
      id, case_number, chamber, chamber_slug, decision_nature,
      subject, subject_short, decision_date, pdf_url, keywords,
      summary_ar, source, created_at,
      tags:jurisprudence_tags(id, code_slug, article_number, display_label, article_id)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Decision
}

export async function getDecisionsByArticle(
  articleId: string,
  limit = 3
): Promise<Decision[]> {
  const supabase = createPublicClient()

  // Get jurisprudence IDs linked to this article
  const { data: tagRows, error: tagErr } = await supabase
    .from('jurisprudence_tags')
    .select('jurisprudence_id')
    .eq('article_id', articleId)
    .limit(limit + 5) // fetch a few extra to handle joins

  if (tagErr || !tagRows?.length) return []

  const ids = [...new Set(tagRows.map(t => t.jurisprudence_id))].slice(0, limit)

  const { data, error } = await supabase
    .from('jurisprudence')
    .select(`
      id, case_number, chamber, chamber_slug, decision_nature,
      subject_short, decision_date, pdf_url, source, created_at,
      tags:jurisprudence_tags(id, code_slug, article_number, display_label, article_id)
    `)
    .in('id', ids)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as Decision[]
}

export async function countDecisions(): Promise<{
  total: number
  byChamber: Record<string, number>
}> {
  const supabase = createPublicClient()

  const { count: total } = await supabase
    .from('jurisprudence')
    .select('*', { count: 'exact', head: true })

  // Count per chamber_slug
  const { data: chamberData } = await supabase
    .from('jurisprudence')
    .select('chamber_slug')

  const byChamber: Record<string, number> = {}
  for (const row of chamberData ?? []) {
    const k = row.chamber_slug ?? 'other'
    byChamber[k] = (byChamber[k] ?? 0) + 1
  }

  return { total: total ?? 0, byChamber }
}

export async function searchDecisions(query: string, limit = 10): Promise<Decision[]> {
  if (!query.trim()) return []
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('jurisprudence')
    .select('id, case_number, chamber_slug, subject_short, decision_date, pdf_url')
    .or(`case_number.ilike.%${query}%,subject.ilike.%${query}%,subject_short.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as Decision[]
}
