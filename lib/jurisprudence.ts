// ── lib/jurisprudence.ts ──────────────────────────────────────────────────────
// Fonctions de lecture — SERVER ONLY (utilise createPublicClient / next/headers)
// Pour les composants client, importer lib/jurisprudence-types.ts

import { createServiceClient } from './supabase/server'
export type { Decision, DecisionsPage } from './jurisprudence-types'
export { caseTypeColor, resultColor } from './jurisprudence-types'
import type { Decision } from './jurisprudence-types'

export async function getDecision(id: string): Promise<Decision | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('jurisprudence')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Decision
}

/** Fetch initial decisions for SSR — tries RPC random, falls back to latest 50 */
export async function getInitialDecisions(limit = 50): Promise<Decision[]> {
  const supabase = createServiceClient()

  // Try SQL random function first
  try {
    const { data, error } = await supabase.rpc('get_random_jurisprudence', { p_limit: limit })
    if (!error && data?.length) return data as Decision[]
  } catch { /* fall through */ }

  // Fallback: latest by date
  const { data } = await supabase
    .from('jurisprudence')
    .select('*')
    .order('decision_date', { ascending: false })
    .limit(limit)
  return (data ?? []) as Decision[]
}

export async function countDecisions(): Promise<{
  total: number
  byType: Record<string, number>
}> {
  const supabase = createServiceClient()

  const { count: total } = await supabase
    .from('jurisprudence')
    .select('*', { count: 'exact', head: true })

  const { data } = await supabase
    .from('jurisprudence')
    .select('case_type')

  const byType: Record<string, number> = {}
  for (const row of data ?? []) {
    const k = row.case_type ?? 'غير محدد'
    byType[k] = (byType[k] ?? 0) + 1
  }

  return { total: total ?? 0, byType }
}
