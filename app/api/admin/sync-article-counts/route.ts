import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createServiceClient()

  // Get all codes
  const { data: codes, error: codesErr } = await supabase
    .from('codes')
    .select('id')

  if (codesErr) {
    return NextResponse.json({ error: codesErr.message }, { status: 500 })
  }

  let updated = 0
  for (const code of codes ?? []) {
    // Count articles for this code
    const { count } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('code_id', code.id)

    // Update total_articles
    await supabase
      .from('codes')
      .update({ total_articles: count ?? 0 })
      .eq('id', code.id)

    updated++
  }

  return NextResponse.json({ ok: true, updated })
}
