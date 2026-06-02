// GET /api/jurisprudence/filters
// Returns unique case_type and result values from the table (used to populate dropdowns)
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('jurisprudence')
    .select('case_type, result')

  if (error) { console.error('[filters] error:', error.message); return NextResponse.json({ types: [], results: [] }) }

  const types   = [...new Set((data ?? []).map((d: { case_type: string | null }) => d.case_type).filter(Boolean))]
                    .sort() as string[]
  const results = [...new Set((data ?? []).map((d: { result: string | null }) => d.result).filter(Boolean))]
                    .sort() as string[]

  return NextResponse.json({ types, results })
}
