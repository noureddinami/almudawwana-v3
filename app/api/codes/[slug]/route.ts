import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient()
  const { slug } = await params

  const { data: code, error } = await supabase
    .from('codes')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !code) return NextResponse.json({ message: 'القانون غير موجود' }, { status: 404 })

  // Livres du code
  const { data: books } = await supabase
    .from('books')
    .select('id, code_id, number, title_ar, title_fr, display_order')
    .eq('code_id', code.id)
    .order('display_order')

  // Sections racines (sans parent) avec leurs enfants directs
  const { data: rootSections } = await supabase
    .from('sections')
    .select('id, code_id, book_id, parent_id, number, title_ar, title_fr, level, display_order')
    .eq('code_id', code.id)
    .is('parent_id', null)
    .order('display_order')

  const { data: childSections } = await supabase
    .from('sections')
    .select('id, code_id, book_id, parent_id, number, title_ar, title_fr, level, display_order')
    .eq('code_id', code.id)
    .not('parent_id', 'is', null)
    .order('display_order')

  const sectionsWithChildren = (rootSections ?? []).map(s => ({
    ...s,
    children: (childSections ?? []).filter(c => c.parent_id === s.id),
  }))

  return NextResponse.json({ ...code, books: books ?? [], sections: sectionsWithChildren })
}
