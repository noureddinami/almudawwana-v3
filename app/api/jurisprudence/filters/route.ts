// GET /api/jurisprudence/filters
// Returns unique case_type and result values from the table (used to populate dropdowns)
import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createPublicClient()

  const { data, error } = await supabase
    .from('jurisprudence')
    .select('case_type, result')

  if (error) return NextResponse.json({ types: [], results: [] })

  const types   = [...new Set((data ?? []).map(d => d.case_type).filter(Boolean))]
                    .sort() as string[]
  const results = [...new Set((data ?? []).map(d => d.result).filter(Boolean))]
                    .sort() as string[]

  return NextResponse.json({ types, results })
}
