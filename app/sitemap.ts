import type { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

const BASE_URL = 'https://modawana.app'

// Revalidate daily — sitemaps don't need to be real-time
export const revalidate = 86400

/**
 * Sitemap index — Next.js auto-generates /sitemap.xml pointing to each sub-sitemap.
 *
 * Segments:
 *   0 → static pages + /jurisprudence listing
 *   1 → code pages        (/codes/[slug])
 *   2 → article pages     (/codes/[slug]/المادة-[n])
 *   3 → jurisprudence     (/jurisprudence/[id])
 */
export async function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }]
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient()

  switch (id) {

    // ── 0 : Static + list pages ─────────────────────────────────────────────
    case 0:
      return [
        { url: BASE_URL,                          lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
        { url: `${BASE_URL}/codes`,               lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
        { url: `${BASE_URL}/jurisprudence`,       lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
        { url: `${BASE_URL}/search`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
        { url: `${BASE_URL}/contact`,             lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
        { url: `${BASE_URL}/request-code`,        lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
      ]

    // ── 1 : Code pages ──────────────────────────────────────────────────────
    case 1: {
      const { data: codes } = await supabase
        .from('codes')
        .select('slug')
        .order('title_ar')
      return (codes ?? []).map((c: { slug: string }) => ({
        url:             `${BASE_URL}/codes/${c.slug}`,
        lastModified:    new Date(),
        changeFrequency: 'weekly' as const,
        priority:        0.8,
      }))
    }

    // ── 2 : Article pages ────────────────────────────────────────────────────
    case 2: {
      const { data: articles } = await supabase
        .from('articles')
        .select('number, code:codes(slug)')
        .order('number_int', { ascending: true })
      return (articles ?? [])
        .filter((a: { number: string; code: unknown }) => (a.code as any)?.slug)
        .map((a: { number: string; code: unknown }) => ({
          url:             `${BASE_URL}/codes/${(a.code as any).slug}/المادة-${a.number}`,
          lastModified:    new Date(),
          changeFrequency: 'monthly' as const,
          priority:        0.7,
        }))
    }

    // ── 3 : Jurisprudence decision pages ─────────────────────────────────────
    case 3: {
      const { data: decisions } = await supabase
        .from('jurisprudence')
        .select('id, decision_date')
        .order('decision_date', { ascending: false })
      return (decisions ?? []).map((d: { id: string; decision_date: string | null }) => ({
        url:             `${BASE_URL}/jurisprudence/${d.id}`,
        lastModified:    d.decision_date ? new Date(d.decision_date) : new Date(),
        changeFrequency: 'never' as const,   // court decisions don't change
        priority:        0.6,
      }))
    }

    default:
      return []
  }
}
