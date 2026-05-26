export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Scale, FileText, Calendar, Hash, ChevronLeft, ArrowRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ArticleTag from '@/components/jurisprudence/ArticleTag'
import { getDecision, CHAMBER_LABELS, chamberColor } from '@/lib/jurisprudence'

const BASE_URL = 'https://modawana.app'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const d = await getDecision(id)
  if (!d) return { title: 'قرار غير موجود' }

  const title = `ملف ${d.case_number} — ${CHAMBER_LABELS[d.chamber_slug ?? ''] ?? 'محكمة النقض'}`
  const desc  = d.subject_short ?? 'قرار محكمة النقض المغربية'

  return {
    title,
    description: desc,
    openGraph: {
      title: `${title} | المدوّنة`,
      description: desc,
      url: `${BASE_URL}/jurisprudence/${id}`,
      type: 'article',
      locale: 'ar_MA',
    },
    alternates: { canonical: `${BASE_URL}/jurisprudence/${id}` },
  }
}

export default async function DecisionPage({ params }: Props) {
  const { id } = await params
  const d = await getDecision(id)
  if (!d) notFound()

  const colors  = chamberColor(d.chamber_slug)
  const chamber = CHAMBER_LABELS[d.chamber_slug ?? ''] ?? 'غير محدد'
  const tags    = d.tags ?? []

  const formattedDate = d.decision_date
    ? new Date(d.decision_date).toLocaleDateString('ar-MA', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : null

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/jurisprudence" className="hover:text-[#2152cc] transition-colors flex items-center gap-1">
            <Scale className="w-3.5 h-3.5" />
            الاجتهاد القضائي
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-medium">ملف {d.case_number}</span>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Color bar */}
          <div className={`h-1.5 ${colors.bar}`} />

          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`text-sm px-3 py-1 rounded-full border font-medium ${colors.bg} ${colors.text} ${colors.border}`}>
                    {chamber}
                  </span>
                  {d.decision_nature && (
                    <span className="text-sm bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
                      {d.decision_nature}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Hash className="w-3.5 h-3.5" />
                    <strong className="text-slate-800">{d.case_number}</strong>
                  </span>
                  {formattedDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formattedDate}
                    </span>
                  )}
                </div>
              </div>

              {d.pdf_url && (
                <a
                  href={d.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#2152cc] hover:bg-[#1a43a8]
                             text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  نص القرار PDF
                </a>
              )}
            </div>

            {/* Subject */}
            {d.subject && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">موضوع القرار</h2>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-base text-slate-800 leading-loose font-amiri whitespace-pre-wrap">
                    {d.subject}
                  </p>
                </div>
              </div>
            )}

            {/* Summary */}
            {d.summary_ar && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">الملخص</h2>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm text-slate-700 leading-loose font-amiri whitespace-pre-wrap">
                    {d.summary_ar}
                  </p>
                </div>
              </div>
            )}

            {/* Article tags */}
            {tags.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  المواد المرجعية
                </h2>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <ArticleTag key={tag.id} tag={tag} size="md" />
                  ))}
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>المصدر: {d.source}</span>
              <span>{new Date(d.created_at).toLocaleDateString('ar-MA')}</span>
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="mt-6">
          <Link
            href="/jurisprudence"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#2152cc] transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            العودة إلى قائمة القرارات
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
