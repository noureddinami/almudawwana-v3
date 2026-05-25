export const dynamic = 'force-dynamic'

import type { Metadata } from 'next';
import Link from 'next/link';
import { createPublicClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Scale, ChevronLeft, Search, BookOpen } from 'lucide-react';
import ShareButton from '@/components/ShareButton';
import CacheHydrator from '@/components/CacheHydrator';
import { BreadcrumbJsonLd, CollectionPageJsonLd } from '@/components/JsonLd';
import CodesGrid, { type PublicCodeType } from '@/components/CodesGrid';

const BASE_URL = 'https://modawana.app'

export const metadata: Metadata = {
  title: 'جميع القوانين والمدونات المغربية',
  description: 'جميع القوانين والمدونات المغربية: المسطرة الجنائية، القانون الجنائي، مدونة الأسرة، مدونة الشغل، الدستور، القوانين التنظيمية والمراسيم. نصوص رسمية من الجريدة الرسمية المغربية.',
  openGraph: {
    title: 'جميع القوانين والمدونات المغربية | المدوّنة',
    description: 'المسطرة الجنائية، القانون الجنائي، مدونة الأسرة، مدونة الشغل والقوانين التنظيمية — نصوص رسمية مجاناً.',
    url: `${BASE_URL}/codes`,
    type: 'website',
    locale: 'ar_MA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'جميع القوانين المغربية | المدوّنة',
    description: 'المسطرة الجنائية، القانون الجنائي، مدونة الأسرة، مدونة الشغل — نصوص رسمية مجاناً.',
  },
  alternates: { canonical: `${BASE_URL}/codes` },
}


async function getAllCodes() {
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('codes')
      .select('id, slug, title_ar, title_fr, type, status, promulgation_date, official_number, keywords, articles(count)')
      .order('slug', { ascending: true })
    // Replace total_articles with the real count from the articles table, sort desc
    return (data ?? [])
      .map((c: any) => ({
        ...c,
        total_articles: (c.articles as { count: number }[])?.[0]?.count ?? 0,
        articles: undefined,
      }))
      .sort((a: any, b: any) => b.total_articles - a.total_articles)
  } catch { return [] }
}

async function getAllCodeTypes(): Promise<PublicCodeType[]> {
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('code_types')
      .select('id, slug, name_ar, color, sort_order')
      .order('sort_order', { ascending: true })
    return (data ?? []) as PublicCodeType[]
  } catch { return [] }
}

export default async function CodesPage() {
  const [allCodes, codeTypes] = await Promise.all([
    getAllCodes(),
    getAllCodeTypes(),
  ]);

  const totalArticles = allCodes.reduce((s: number, c: any) => s + (c.total_articles ?? 0), 0);
  const codesWithArticles = allCodes.filter((c: any) => (c.total_articles ?? 0) > 0).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
      <BreadcrumbJsonLd
        items={[
          { name: 'الرئيسية', url: BASE_URL },
          { name: 'القوانين', url: `${BASE_URL}/codes` },
        ]}
      />
      <CollectionPageJsonLd
        name="جميع القوانين والمدونات المغربية"
        description="تصفّح جميع القوانين والمدونات المغربية — الدستور، القوانين التنظيمية، المدونات، المراسيم بقوانين."
        url={`${BASE_URL}/codes`}
        items={allCodes.map((c: any) => ({ name: c.title_ar, url: `${BASE_URL}/codes/${c.slug}` }))}
      />
      <CacheHydrator store="codes" cacheKey="all" data={allCodes} />
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-l from-blue-800 to-blue-900 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-kufi text-2xl font-bold flex-1">جميع القوانين والمدونات</h1>
            <ShareButton
              variant="icon"
              title="جميع القوانين والمدونات المغربية"
              text="تصفّح جميع القوانين والمدونات المغربية مجاناً — المدوّنة"
            />
          </div>
          <p className="text-blue-200 text-sm max-w-xl leading-relaxed">
            {codesWithArticles} قانون ومدونة تضم أكثر من{' '}
            <span className="text-white font-bold">{totalArticles.toLocaleString('en')}</span>{' '}
            مادة قانونية — المصدر: الجريدة الرسمية المغربية
          </p>
        </div>
      </div>

      {/* ── Breadcrumb + search link ────────────────────────── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/" className="hover:text-blue-600">الرئيسية</Link>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800 font-medium">القوانين</span>
          </nav>
          <Link href="/search"
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
            <Search className="w-3.5 h-3.5" />
            البحث المتقدم
          </Link>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-10 flex-1 w-full space-y-4">
        <CodesGrid codes={allCodes} codeTypes={codeTypes} />

        {allCodes.length === 0 && (
          <div className="text-center py-24 text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>لا توجد قوانين متاحة حالياً</p>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 pt-4 border-t border-slate-200">
          جميع النصوص مصدرها الجريدة الرسمية للمملكة المغربية —{' '}
          <a href="https://www.sgg.gov.ma" target="_blank" rel="noopener noreferrer"
             className="underline hover:text-slate-600">sgg.gov.ma</a>
        </p>
      </main>

      <Footer />
    </div>
  );
}
