/** JSON-LD structured data components for SEO */

const BASE_URL = 'https://almudawwana-v3.vercel.app'

/* ── Organization + WebSite (homepage) ────────────────────────────── */
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'المدوّنة — Al-Mudawwana',
        url: BASE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/icon-512x512.png`,
          width: 512,
          height: 512,
        },
        description: 'الموسوعة القانونية المغربية الشاملة — القوانين والمدونات في متناول الجميع',
        sameAs: [],
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: BASE_URL,
        name: 'المدوّنة',
        description: 'الموسوعة القانونية المغربية الشاملة',
        publisher: { '@id': `${BASE_URL}/#organization` },
        inLanguage: ['ar-MA', 'fr-MA'],
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${BASE_URL}/search?tab=text&q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

/* ── BreadcrumbList ───────────────────────────────────────────────── */
export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[]
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

/* ── Legislation (code juridique) ─────────────────────────────────── */
export function LegislationJsonLd({
  name,
  nameFr,
  url,
  datePublished,
  legislationType,
  totalArticles,
}: {
  name: string
  nameFr?: string | null
  url: string
  datePublished?: string | null
  legislationType?: string
  totalArticles?: number
}) {
  const data: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Legislation',
    name,
    url,
    inLanguage: 'ar-MA',
    jurisdiction: {
      '@type': 'AdministrativeArea',
      name: 'المملكة المغربية',
    },
    legislationJurisdiction: 'MA',
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
    },
  }

  if (nameFr) data.alternateName = nameFr
  if (datePublished) data.datePublished = datePublished
  if (legislationType) data.legislationType = legislationType
  if (totalArticles) data.numberOfPages = totalArticles

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

/* ── CollectionPage (liste de codes ou résultats) ────────────────── */
export function CollectionPageJsonLd({
  name,
  description,
  url,
  items,
}: {
  name: string
  description: string
  url: string
  items?: { name: string; url: string }[]
}) {
  const data: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    inLanguage: 'ar-MA',
    isPartOf: { '@type': 'WebSite', '@id': `${BASE_URL}/#website` },
  }

  if (items?.length) {
    data.mainEntity = {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        url: item.url,
      })),
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

/* ── LegalArticle (مادة قانونية) ──────────────────────────────────── */
export function LegalArticleJsonLd({
  articleNumber,
  content,
  url,
  codeName,
  codeUrl,
  status,
}: {
  articleNumber: string
  content: string
  url: string
  codeName: string
  codeUrl: string
  status?: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    name: `المادة ${articleNumber} — ${codeName}`,
    headline: `المادة ${articleNumber} من ${codeName}`,
    url,
    inLanguage: 'ar-MA',
    articleBody: content.slice(0, 500),
    isPartOf: {
      '@type': 'Legislation',
      name: codeName,
      url: codeUrl,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
    },
    ...(status && { keywords: status === 'in_force' ? 'ساري المفعول' : status === 'amended' ? 'مُعدَّل' : status === 'abrogated' ? 'مُلغى' : '' }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
