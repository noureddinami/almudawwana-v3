import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, slugify } from '@/lib/supabase/helpers'

/**
 * One-time migration: regenerate code slugs from title_ar (Arabic title with hyphens).
 * POST /api/admin/migrate-slugs
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase } = authResult

  const { data: codes, error } = await supabase
    .from('codes')
    .select('id, title_ar, title_fr, slug')
    .order('title_ar')

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  const results: { id: string; old_slug: string; new_slug: string }[] = []

  for (const code of codes ?? []) {
    // Generate slug from Arabic title
    let newSlug = slugify(code.title_ar)

    // Check for uniqueness
    const { data: existing } = await supabase
      .from('codes')
      .select('id')
      .eq('slug', newSlug)
      .neq('id', code.id)
      .maybeSingle()

    if (existing) {
      // If collision, append a suffix
      let i = 2
      while (true) {
        const candidate = `${newSlug}-${i}`
        const { data: check } = await supabase
          .from('codes')
          .select('id')
          .eq('slug', candidate)
          .neq('id', code.id)
          .maybeSingle()
        if (!check) { newSlug = candidate; break }
        i++
      }
    }

    if (newSlug !== code.slug) {
      await supabase.from('codes').update({ slug: newSlug }).eq('id', code.id)
      results.push({ id: code.id, old_slug: code.slug, new_slug: newSlug })
    }
  }

  return NextResponse.json({
    message: `تم تحديث ${results.length} slug`,
    total: (codes ?? []).length,
    updated: results,
  })
}
