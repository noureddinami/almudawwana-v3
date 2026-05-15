import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('code_types')
    .select('id, slug, name_ar, name_fr, color, sort_order')
    .order('sort_order')
    .order('id')

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}
