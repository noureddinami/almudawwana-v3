// ISR : revalidate toutes les heures — la liste initiale est dans le HTML
export const revalidate = 3600

import type { Metadata } from 'next'
import { Scale } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { countDecisions, getInitialDecisions } from '@/lib/jurisprudence'
import JurisprudenceList from './JurisprudenceList'
import type { Decision } from '@/lib/jurisprudence-types'

const BASE_URL = 'https://modawana.app'

export const metadata: Metadata = {
  title: 'الاجتهاد القضائي — محكمة النقض',
  description: 'قرارات محكمة النقض المغربية — ابحث وتصفح الاجتهاد القضائي المغربي بالكلمات المفتاحية أو حسب نوع القضية والنتيجة',
  keywords: 'الاجتهاد القضائي, محكمة النقض, قرارات قضائية, المغرب',
  openGraph: {
    title: 'الاجتهاد القضائي | المدوّنة',
    description: 'قرارات محكمة النقض المغربية — مرتبطة بالقانون المغربي',
    url: `${BASE_URL}/jurisprudence`,
    type: 'website',
    locale: 'ar_MA',
    siteName: 'المدوّنة — Al-Mudawwana',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', title: 'الاجتهاد القضائي | المدوّنة' },
  alternates: {
    canonical: `${BASE_URL}/jurisprudence`,
    languages: {
      'ar-MA':    `${BASE_URL}/jurisprudence`,
      'x-default': `${BASE_URL}/jurisprudence`,
    },
  },
}

export default async function JurisprudencePage() {
  // Both fetches run in parallel — content lands in the initial HTML
  const [stats, initialDecisions] = await Promise.all([
    countDecisions(),
    getInitialDecisions(50),
  ])

  const typesWithData = Object.entries(stats.byType)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-l from-[#2152cc] to-blue-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-kufi font-bold text-2xl sm:text-3xl leading-tight">
                الاجتهاد القضائي
              </h1>
              <p className="text-blue-200 text-sm mt-0.5">قرارات محكمة النقض المغربية</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
              <p className="text-2xl font-bold font-kufi">{stats.total.toLocaleString('ar-MA')}</p>
              <p className="text-xs text-blue-200 mt-0.5">قرار قضائي</p>
            </div>
            {typesWithData.slice(0, 4).map(([type, count]) => (
              <div key={type} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
                <p className="text-lg font-bold">{count.toLocaleString('ar-MA')}</p>
                <p className="text-xs text-blue-200 mt-0.5">{type}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* List — receives SSR data as initialData prop */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <JurisprudenceList initialData={initialDecisions as Decision[]} />
      </div>

      <Footer />
    </div>
  )
}
