import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('commentaries')
    .select(`
      id, content_ar, created_at,
      article:articles(id, slug, number, code:codes(slug, title_ar))
    `)
    .eq('type', 'annotation')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}
