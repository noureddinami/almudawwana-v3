import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, slugify } from '@/lib/supabase/helpers'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const { data: types, error } = await supabase
    .from('code_types')
    .select('id, slug, name_ar, name_fr, color, sort_order')
    .order('sort_order').order('id')

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  // Compter les codes par type
  const result = await Promise.all((types ?? []).map(async (t) => {
    const { count } = await supabase
      .from('codes')
      .select('*', { count: 'exact', head: true })
      .eq('type', t.slug)
    return { ...t, codes_count: count ?? 0 }
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const body = await req.json()
  const { name_ar, name_fr, color, sort_order } = body

  if (!name_ar) return NextResponse.json({ message: 'name_ar مطلوب' }, { status: 422 })

  const { data: maxOrder } = await supabase
    .from('code_types')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const { data, error } = await supabase
    .from('code_types')
    .insert({
      name_ar,
      name_fr:    name_fr ?? null,
      color:      color ?? 'slate',
      sort_order: sort_order ?? (((maxOrder as any)?.sort_order ?? 0) + 1),
      slug:       slugify(name_ar) + '-' + Math.random().toString(36).slice(2, 6),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ ...data, codes_count: 0 }, { status: 201 })
}
