// Court decisions are immutable — revalidate once a day is more than enough
export const revalidate = 86400

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Scale, Calendar, Hash, ChevronLeft, ArrowRight, Tag } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { getDecision } from '@/lib/jurisprudence'
import { caseTypeColor, resultColor } from '@/lib/jurisprudence-types'
import { PdfButtons } from '@/components/PdfButtons'
import { JurisprudenceJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd'

const BASE_URL = 'https://modawana.app'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const d = await getDecision(id)
  if (!d) return { title: 'قرار غير موجود' }

  const title = `ملف ${d.file_number} — قرار ${d.case_number}`
  const desc  = (d.subject ?? '').slice(0, 160) || 'قرار محكمة النقض المغربية'

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

  const tc = caseTypeColor(d.case_type)
  const rc = resultColor(d.result)

  const formattedDate = d.decision_date
    ? new Date(d.decision_date).toLocaleDateString('ar-MA', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : null

  const pageUrl = `${BASE_URL}/jurisprudence/${d.id}`

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
      {/* JSON-LD structured data */}
      <JurisprudenceJsonLd
        id={d.id}
        caseNumber={d.case_number}
        fileNumber={d.file_number}
        subject={d.subject}
        decisionDate={d.decision_date}
        caseType={d.case_type}
        result={d.result}
        url={pageUrl}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'الرئيسية',       url: BASE_URL },
          { name: 'الاجتهاد القضائي', url: `${BASE_URL}/jurisprudence` },
          { name: `ملف ${d.file_number}`, url: pageUrl },
        ]}
      />
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/jurisprudence" className="hover:text-[#2152cc] transition-colors flex items-center gap-1">
            <Scale className="w-3.5 h-3.5" />
            الاجتهاد القضائي
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-medium font-mono">{d.file_number}</span>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Color bar */}
          <div className={`h-1.5 ${tc.bar}`} />

          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {d.case_type && (
                    <span className={`text-sm px-3 py-1 rounded-full border font-medium ${tc.bg} ${tc.text} ${tc.border}`}>
                      {d.case_type}
                    </span>
                  )}
                  {d.result && (
                    <span className={`text-sm px-3 py-1 rounded-full border ${rc.bg} ${rc.text} ${rc.border}`}>
                      <Tag className="w-3 h-3 inline ml-1 -mt-0.5" />
                      {d.result}
                    </span>
                  )}
                </div>
                <div className="flex items-center flex-wrap gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Hash className="w-3.5 h-3.5" />
                    رقم الملف: <strong className="text-slate-800">{d.file_number}</strong>
                  </span>
                  <span className="flex items-center gap-1.5 font-mono">
                    رقم القرار: <strong className="text-slate-700">{d.case_number}</strong>
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
                <PdfButtons
                  url={d.pdf_url}
                  title={`قرار ${d.case_number} — ملف ${d.file_number}`}
                  size="md"
                />
              )}
            </div>

            {/* Subject */}
            {d.subject && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  الموضوع — القاعدة القانونية
                </h2>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <p className="text-base text-slate-800 leading-loose font-amiri whitespace-pre-wrap">
                    {d.subject}
                  </p>
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
              <span>المصدر: huquqai.ma</span>
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
