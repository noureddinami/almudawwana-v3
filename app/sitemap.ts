import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/server'

const BASE_URL = 'https://modawana.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient()

  // Fetch all codes with slug
  const { data: codes } = await supabase
    .from('codes')
    .select('id, slug')
    .order('title_ar')

  // Fetch all articles with number and code slug
  const { data: articles } = await supabase
    .from('articles')
    .select('id, number, code:codes(slug)')
    .order('number_int', { ascending: true })

  // Build code slug lookup
  const codeSlugMap = new Map<string, string>()
  if (codes) {
    for (const code of codes) {
      codeSlugMap.set(code.id, code.slug)
    }
  }

  const entries: MetadataRoute.Sitemap = [
    // Static pages
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/codes`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Code pages
  if (codes) {
    for (const code of codes) {
      entries.push({
        url: `${BASE_URL}/codes/${code.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }
  }

  // Article pages
  if (articles) {
    for (const article of articles) {
      const codeSlug = (article.code as any)?.slug
      if (codeSlug) {
        entries.push({
          url: `${BASE_URL}/codes/${codeSlug}/المادة-${article.number}`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.7,
        })
      }
    }
  }

  return entries
}
