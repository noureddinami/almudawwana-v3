// Legal article text is stable — revalidate once a day
// Comments section is client-side so no ISR conflict
export const revalidate = 86400

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createPublicClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CommentsSection from '@/components/CommentsSection';
import { ChevronLeft, StickyNote } from 'lucide-react';
import CacheHydrator from '@/components/CacheHydrator';
import { LegalArticleJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd';
import { extractKeywords, autoDescription } from '@/lib/seoKeywords';
import ArticleReader from '@/components/ArticleReader'

const BASE_URL = 'https://modawana.app'

interface Props {
  params: Promise<{ slug: string; articleSlug: string }>;
}

/** Extract article number from slug like "المادة-55" → "55" */
function extractArticleNumber(articleSlug: string): string {
  const decoded = decodeURIComponent(articleSlug)
  const match = decoded.match(/^المادة[_-](.+)$/)
  if (match) return match[1]
  return decoded
}

async function getCodeBySlug(slug: string) {
  try {
    const supabase = createPublicClient()
    const decoded = decodeURIComponent(slug)
    const { data } = await supabase
      .from('codes')
      .select('id, slug, title_ar, title_fr')
      .eq('slug', decoded)
      .single()
    return data
  } catch { return null }
}

async function getArticleByNumber(codeId: string, articleNumber: string) {
  try {
    const supabase = createPublicClient()

    const { data: article, error } = await supabase
      .from('articles')
      .select(`
        id, slug, number, number_int, content_ar, content_fr, status,
        view_count, comment_count,
        section:sections(id, title_ar, number),
        code:codes(id, slug, title_ar)
      `)
      .eq('code_id', codeId)
      .eq('number', articleNumber)
      .single()

    if (error || !article) return null

    // Tags
    const { data: tagRows } = await supabase
      .from('article_tags')
      .select('tag:tags(id, name_ar, slug)')
      .eq('article_id', article.id)

    // Admin notes
    const { data: adminNotes } = await supabase
      .from('commentaries')
      .select('id, content_ar, created_at, author:profiles!author_id(full_name)')
      .eq('article_id', article.id)
      .eq('type', 'annotation')
      .eq('status', 'approved')
      .order('created_at')

    const code    = article.code as any
    const section = article.section as any
    return {
      ...article,
      code:    code    as { id: string; slug: string; title_ar: string } | null,
      section: section as { id: string; title_ar: string; number: string } | null,
      tags:    (tagRows as any[])?.map((t: any) => t.tag).filter(Boolean) ?? [],
      admin_notes: (adminNotes ?? []).map((n: any) => ({
        ...n,
        author: Array.isArray(n.author) ? n.author[0] : n.author,
      })),
    }
  } catch { return null }
}

/** Fetch the adjacent articles (prev = lower number_int, next = higher) */
async function getPrevNext(codeId: string, numberInt: number | null) {
  if (numberInt == null) return { prev: null, next: null }
  try {
    const supabase = createPublicClient()
    const [{ data: prevData }, { data: nextData }] = await Promise.all([
      supabase
        .from('articles')
        .select('number')
        .eq('code_id', codeId)
        .lt('number_int', numberInt)
        .order('number_int', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('articles')
        .select('number')
        .eq('code_id', codeId)
        .gt('number_int', numberInt)
        .order('number_int', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ])
    return { prev: prevData ?? null, next: nextData ?? null }
  } catch { return { prev: null, next: null } }
}

const statusLabel: Record<string, { label: string; cls: string }> = {
  in_force:  { label: 'ساري المفعول',  cls: 'bg-green-50  text-green-700  border-green-200' },
  amended:   { label: 'مُعدَّل',        cls: 'bg-amber-50  text-amber-700  border-amber-200' },
  abrogated: { label: 'مُلغى',          cls: 'bg-red-50    text-red-700    border-red-200'   },
  draft:     { label: 'مشروع',          cls: 'bg-slate-100 text-slate-600  border-slate-200' },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: codeSlug, articleSlug } = await params
  const articleNumber = extractArticleNumber(articleSlug)
  const code = await getCodeBySlug(codeSlug)
  if (!code) return { title: 'غير موجود' }

  const article = await getArticleByNumber(code.id, articleNumber)
  if (!article) return { title: 'غير موجود' }

  const codeName  = article.code?.title_ar ?? code.title_ar
  const title     = `المادة ${article.number} — ${codeName}`
  const url       = `${BASE_URL}/codes/${codeSlug}/المادة-${article.number}`

  const description = (article as any).meta_description
    ?? autoDescription(article.content_ar ?? '', title)

  const keywordsArr: string[] = ((article as any).keywords as string[] | null)
    ?? extractKeywords(article.content_ar ?? '', [codeName, `المادة ${article.number}`])

  return {
    title,
    description,
    keywords: keywordsArr.join(', '),
    openGraph: {
      title: `${title} | المدوّنة`,
      description,
      url,
      type: 'article',
      locale: 'ar_MA',
      siteName: 'المدوّنة — Al-Mudawwana',
      images: [{ url: `${BASE_URL}/icon-512x512.png`, width: 512, height: 512 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | المدوّنة`,
      description: description.slice(0, 200),
    },
    alternates: {
      canonical: url,
      languages: {
        'ar-MA':    url,
        'x-default': url,
      },
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug: codeSlug, articleSlug } = await params;
  const articleNumber = extractArticleNumber(articleSlug);

  const code = await getCodeBySlug(codeSlug);
  if (!code) notFound();

  const article = await getArticleByNumber(code.id, articleNumber);
  if (!article) notFound();

  // fetch prev/next in parallel (non-blocking for page render)
  const neighbors = await getPrevNext(code.id, article.number_int);

  const status      = statusLabel[article.status] ?? statusLabel.in_force;
  const codeName    = article.code?.title_ar ?? code.title_ar;
  const codeSlugVal = article.code?.slug ?? codeSlug;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
      <LegalArticleJsonLd
        articleNumber={article.number}
        content={article.content_ar ?? ''}
        url={`${BASE_URL}/codes/${codeSlugVal}/المادة-${article.number}`}
        codeName={codeName}
        codeUrl={`${BASE_URL}/codes/${codeSlugVal}`}
        status={article.status}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'الرئيسية', url: BASE_URL },
          { name: 'القوانين', url: `${BASE_URL}/codes` },
          { name: codeName,   url: `${BASE_URL}/codes/${codeSlugVal}` },
          { name: `المادة ${article.number}`, url: `${BASE_URL}/codes/${codeSlugVal}/المادة-${article.number}` },
        ]}
      />
      <CacheHydrator store="article" cacheKey={article.id} data={article} />
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 flex-wrap">
            <Link href="/" className="hover:text-blue-600 transition-colors">القوانين</Link>
            <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-300" />
            <Link href={`/codes/${codeSlugVal}`}
                  className="hover:text-blue-600 transition-colors truncate max-w-[140px] sm:max-w-[200px]">
              {codeName}
            </Link>
            <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-300" />
            <span className="text-slate-800 font-medium">م. {article.number}</span>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-0 sm:px-4 py-0 sm:py-8 flex-1 w-full">

        {/* Article card — fully client (dark mode, swipe, font size, copy popup) */}
        <ArticleReader
          article={{
            id:            article.id,
            number:        article.number,
            content_ar:    article.content_ar,
            content_fr:    article.content_fr,
            status:        article.status,
            view_count:    article.view_count,
            comment_count: article.comment_count,
            section:       article.section,
            tags:          article.tags,
          }}
          codeName={codeName}
          codeSlug={codeSlugVal}
          statusMeta={status}
          prev={neighbors.prev}
          next={neighbors.next}
        />

        {/* Admin notes */}
        {article.admin_notes && article.admin_notes.length > 0 && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-200 bg-amber-100/60">
              <StickyNote className="w-4 h-4 text-amber-700" />
              <h3 className="text-sm font-bold text-amber-800">ملاحظات الإدارة</h3>
            </div>
            <div className="divide-y divide-amber-100">
              {article.admin_notes.map(note => (
                <div key={note.id} className="px-5 py-4">
                  <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
                    {note.content_ar}
                  </p>
                  {note.author?.full_name && (
                    <p className="mt-2 text-xs text-amber-600">— {note.author.full_name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-5 p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 leading-relaxed">
          ⚠️ هذا النص للمعلومات العامة فقط —{' '}
          <strong>لا يُعدّ مرجعاً قانونياً رسمياً</strong>.
          يُرجى الرجوع إلى النص الرسمي في الجريدة الرسمية للمملكة المغربية{' '}
          <a href="https://www.sgg.gov.ma" target="_blank" rel="noopener noreferrer"
             className="underline font-medium hover:text-amber-900">(sgg.gov.ma)</a>{' '}
          أو استشارة محامٍ مؤهّل.
        </div>

        {/* Comments */}
        <CommentsSection articleSlug={article.id} initialCount={article.comment_count} />

        {/* Bottom navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Link href={`/codes/${codeSlugVal}`}
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600">
            <ChevronLeft className="w-4 h-4 rotate-180" />
            العودة إلى {codeName}
          </Link>
          <Link href="/search" className="text-sm text-slate-400 hover:text-blue-600">
            بحث في القوانين ←
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
