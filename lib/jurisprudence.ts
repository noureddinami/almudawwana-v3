// ── lib/jurisprudence.ts ──────────────────────────────────────────────────────
// Fonctions de lecture — SERVER ONLY (utilise createPublicClient / next/headers)
// Pour les composants client, importer lib/jurisprudence-types.ts

import { createPublicClient } from './supabase/server'
export type { Decision, DecisionsPage } from './jurisprudence-types'
export { extractKeywords, caseTypeColor, resultColor } from './jurisprudence-types'
import type { Decision } from './jurisprudence-types'

export async function getDecision(id: string): Promise<Decision | null> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('jurisprudence')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Decision
}

export async function countDecisions(): Promise<{
  total: number
  byType: Record<string, number>
}> {
  const supabase = createPublicClient()

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
