export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createPublicClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ArticlesList from '@/components/ArticlesList';
import { Scale, ChevronLeft, Download, ExternalLink } from 'lucide-react';


interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function getCode(id: string) {
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('codes')
      .select('id, slug, title_ar, title_fr, status, official_number, promulgation_date, source_url, total_articles')
      .eq('id', id)
      .single()
    return data
  } catch { return null }
}

async function getArticles(codeId: string, page: number, perPage = 50) {
  try {
    const supabase = createPublicClient()
    const from = (page - 1) * perPage
    const to = from + perPage - 1
    const { data, count } = await supabase
      .from('articles')
      .select('id, slug, number, number_int, content_ar, status, view_count, comment_count, section:sections(id, title_ar)', { count: 'exact' })
      .eq('code_id', codeId)
      .order('number_int', { ascending: true, nullsFirst: false })
      .order('number', { ascending: true })
      .range(from, to)
    const total = count ?? 0
    const articles = (data ?? []).map((a: any) => ({
      ...a,
      section: Array.isArray(a.section) ? a.section[0] : a.section,
    }))
    return {
      data: articles,
      current_page: page,
      last_page: Math.ceil(total / perPage) || 1,
      total,
    }
  } catch { return null }
}

async function getPdfs(codeId: string) {
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('pdf_documents')
      .select('id, title_ar, source_url')
      .eq('code_id', codeId)
    return data ?? []
  } catch { return [] }
}

export default async function CodePage({ params, searchParams }: Props) {
  const { slug: codeId } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? 1);

  const [code, articlesData, pdfs] = await Promise.all([
    getCode(codeId),
    getArticles(codeId, page),
    getPdfs(codeId),
  ]);

  if (!code) notFound();

  const articles = articlesData?.data ?? [];
  const pagination = articlesData
    ? {
        current: articlesData.current_page,
        last: articlesData.last_page,
        total: articlesData.total,
      }
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            القوانين
          </Link>

          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-kufi text-lg sm:text-2xl font-bold text-slate-900 leading-tight">
                {code.title_ar}
              </h1>
              {code.title_fr && (
                <p className="text-sm text-slate-400 mt-0.5" dir="ltr">{code.title_fr}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                {pagination && (
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium text-xs">
                    {pagination.total} مادة
                  </span>
                )}
                {code.promulgation_date && (
                  <span>سنة {new Date(code.promulgation_date).getFullYear()}</span>
                )}
              </div>
            </div>

            {/* Official source link */}
            {((code as any).source_url || pdfs.some((p: any) => p.source_url)) && (
              <div className="shrink-0 flex flex-col gap-2">
                {/* Primary: direct link on the code */}
                {(code as any).source_url && (
                  <a
                    href={(code as any).source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600
                               bg-slate-100 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors
                               border border-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    النص الرسمي
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>
                )}
                {/* Secondary: per-PDF source links (if different from code link) */}
                {pdfs
                  .filter((p: any) => p.source_url && p.source_url !== (code as any).source_url)
                  .map((pdf: any) => (
                    <a
                      key={pdf.id}
                      href={pdf.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600
                                 bg-slate-100 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors
                                 border border-slate-200"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {pdf.title_ar ?? 'النص الرسمي'}
                      <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Articles */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <ArticlesList
          articles={articles}
          slug={codeId}
          pagination={pagination}
          currentPage={page}
        />
      </div>

      <Footer />
    </div>
  );
}
