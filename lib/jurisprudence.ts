// ── lib/jurisprudence.ts ──────────────────────────────────────────────────────
// Fonctions de lecture — SERVER ONLY (utilise createPublicClient / next/headers)
// Pour les composants client, importer lib/jurisprudence-types.ts

import { createPublicClient } from './supabase/server'

// Ré-exporter les types et constantes depuis le fichier partagé
export type { JurisTag, Decision, DecisionsPage } from './jurisprudence-types'
export { CHAMBER_LABELS, CHAMBER_COLORS, chamberColor } from './jurisprudence-types'

import type { Decision, DecisionsPage } from './jurisprudence-types'

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
