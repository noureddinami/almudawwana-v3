import type { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

const BASE_URL = 'https://modawana.app'

// Rebuild daily — content is stable
export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient()

  // Fetch all data in parallel
  const [
    { data: codes },
    { data: articles },
    { data: decisions },
  ] = await Promise.all([
    supabase.from('codes').select('slug').order('title_ar'),
    supabase.from('articles').select('number, code:codes(slug)').order('number_int', { ascending: true }),
    supabase.from('jurisprudence').select('id, decision_date').order('decision_date', { ascending: false }),
  ])

  const entries: MetadataRoute.Sitemap = [
    // Static pages
    { url: BASE_URL,                         lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/codes`,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/jurisprudence`,      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/search`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/request-code`,       lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/contact`,            lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ]

  // Code pages
  for (const code of (codes ?? []) as { slug: string }[]) {
    entries.push({
      url:             `${BASE_URL}/codes/${code.slug}`,
      lastModified:    new Date(),
      changeFrequency: 'weekly',
      priority:        0.8,
    })
  }

  // Article pages
  for (const article of (articles ?? []) as { number: string; code: unknown }[]) {
    const slug = (article.code as any)?.slug
    if (slug) {
      entries.push({
        url:             `${BASE_URL}/codes/${slug}/المادة-${article.number}`,
        lastModified:    new Date(),
        changeFrequency: 'monthly',
        priority:        0.7,
      })
    }
  }

  // Jurisprudence decision pages (NEW — was missing before)
  for (const d of (decisions ?? []) as { id: string; decision_date: string | null }[]) {
    entries.push({
      url:             `${BASE_URL}/jurisprudence/${d.id}`,
      lastModified:    d.decision_date ? new Date(d.decision_date) : new Date(),
      changeFrequency: 'never',   // court decisions are immutable
      priority:        0.6,
    })
  }

  return entries
}
