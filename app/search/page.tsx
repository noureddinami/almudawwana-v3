export const dynamic = 'force-dynamic'

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { createPublicClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SearchableSelect from '@/components/SearchableSelect';
import { BreadcrumbJsonLd } from '@/components/JsonLd';
import { Search, ChevronLeft, BookOpen, Hash } from 'lucide-react';

export const metadata: Metadata = {
  title: 'البحث في القوانين المغربية',
  description: 'ابحث في جميع القوانين والمدونات المغربية — بحث بالنص الحر، برقم المادة، أو بكلمات مفتاحية متعددة.',
  openGraph: {
    title: 'البحث في القوانين المغربية | المدوّنة',
    description: 'ابحث في جميع القوانين والمدونات المغربية — ثلاثة أوضاع للبحث',
    url: 'https://almudawwana-v3.vercel.app/search',
    type: 'website',
    locale: 'ar_MA',
  },
  alternates: {
    canonical: 'https://almudawwana-v3.vercel.app/search',
  },
  robots: {
    index: true,
    follow: true,
  },
}

type Tab = 'text' | 'article';

interface Props {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    kw?: string;
    code?: string;
    number?: string;
    page?: string;
  }>;
}

/* ─── Data helpers ─────────────────────────────────────────────────────────── */

async function getAllCodes() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('codes')
    .select('id, slug, title_ar, total_articles')
    .order('total_articles', { ascending: false, nullsFirst: false })
  return data ?? []
}

/**
 * Tab 1 — recherche par texte (50 % des mots doivent apparaître)
 */
async function searchByText(query: string, codeId: string | null, page: number, perPage: number) {
  const supabase = createPublicClient()
  const words = query.split(/[\s,،.;:]+/).filter(w => w.length >= 2)
  if (!words.length) return null

  const threshold = Math.ceil(words.length * 0.5)

  // Récupérer les articles contenant au moins un mot
  const orFilter = words.map(w => `content_ar.ilike.%${w}%`).join(',')
  let q = supabase
    .from('articles')
    .select('id, number, number_int, slug, content_ar, status, view_count, code_id, code:codes(id, slug, title_ar)')
    .or(orFilter)
    .order('view_count', { ascending: false })
    .limit(1000)

  if (codeId) q = q.eq('code_id', codeId)

  const { data: articles } = await q
  if (!articles) return null

  // Filtrer côté serveur : garder ceux qui contiennent >= threshold mots
  const filtered = articles.filter(a => {
    const content = a.content_ar?.toLowerCase() ?? ''
    const matchCount = words.filter(w => content.includes(w.toLowerCase())).length
    return matchCount >= threshold
  })

  // Trier par nombre de mots matchés (desc), puis par view_count
  filtered.sort((a, b) => {
    const aMatch = words.filter(w => (a.content_ar?.toLowerCase() ?? '').includes(w.toLowerCase())).length
    const bMatch = words.filter(w => (b.content_ar?.toLowerCase() ?? '').includes(w.toLowerCase())).length
    if (bMatch !== aMatch) return bMatch - aMatch
    return (b.view_count ?? 0) - (a.view_count ?? 0)
  })

  const total = filtered.length
  const from = (page - 1) * perPage
  return {
    data: filtered.slice(from, from + perPage),
    current_page: page,
    last_page: Math.ceil(total / perPage) || 1,
    total,
  }
}

/**
 * Tab 2 — recherche par numéro d'article dans un code
 * Renvoie le numéro exact + ses frères (ex: 1 → 1, 1-1, 1.1, 1-2…)
 */
async function searchByNumber(number: string, codeId: string | null, page: number, perPage: number) {
  const supabase = createPublicClient()
  const num = number.trim().replace(/[^\d\-–.مكرر\s]/gu, '')
  if (!num) return null

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  // Exact match + siblings : "1" → 1, 1-1, 1.1, 1-2, 1.2 etc.
  const orFilter = `number.eq.${num},number.like.${num}-%,number.like.${num}.%`

  let q = supabase
    .from('articles')
    .select('id, number, number_int, slug, content_ar, status, view_count, code_id, code:codes(id, slug, title_ar)', { count: 'exact' })
    .or(orFilter)
    .order('number_int', { ascending: true, nullsFirst: false })
    .order('number', { ascending: true })

  if (codeId) q = q.eq('code_id', codeId)

  const { data, count } = await q.range(from, to)

  return {
    data: data ?? [],
    current_page: page,
    last_page: Math.ceil((count ?? 0) / perPage) || 1,
    total: count ?? 0,
  }
}

/**
 * Tab 3 — recherche par mots-clés (60 % des mots-clés doivent apparaître)
 */
async function searchByKeywords(kwString: string, codeId: string | null, page: number, perPage: number) {
  const supabase = createPublicClient()
  const keywords = kwString.split(/[,،\-\s]+/).map(w => w.trim()).filter(w => w.length >= 2)
  if (!keywords.length) return null

  const threshold = Math.ceil(keywords.length * 0.6)

  const orFilter = keywords.map(w => `content_ar.ilike.%${w}%`).join(',')
  let q = supabase
    .from('articles')
    .select('id, number, number_int, slug, content_ar, status, view_count, code_id, code:codes(id, slug, title_ar)')
    .or(orFilter)
    .order('view_count', { ascending: false })
    .limit(1000)

  if (codeId) q = q.eq('code_id', codeId)

  const { data: articles } = await q
  if (!articles) return null

  // Filtrer : garder ceux qui contiennent >= 60 % des mots-clés
  const filtered = articles.filter(a => {
    const content = a.content_ar?.toLowerCase() ?? ''
    const matchCount = keywords.filter(w => content.includes(w.toLowerCase())).length
    return matchCount >= threshold
  })

  filtered.sort((a, b) => {
    const aMatch = keywords.filter(w => (a.content_ar?.toLowerCase() ?? '').includes(w.toLowerCase())).length
    const bMatch = keywords.filter(w => (b.content_ar?.toLowerCase() ?? '').includes(w.toLowerCase())).length
    if (bMatch !== aMatch) return bMatch - aMatch
    return (b.view_count ?? 0) - (a.view_count ?? 0)
  })

  const total = filtered.length
  const from = (page - 1) * perPage
  return {
    data: filtered.slice(from, from + perPage),
    current_page: page,
    last_page: Math.ceil(total / perPage) || 1,
    total,
  }
}

/* ─── UI helpers ───────────────────────────────────────────────────────────── */

function truncateAround(text: string, queryWords: string[], max = 280): string {
  if (!text) return '';
  let idx = -1;
  for (const w of queryWords) {
    const i = text.indexOf(w);
    if (i !== -1 && (idx === -1 || i < idx)) idx = i;
  }
  if (idx === -1 || text.length <= max) {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }
  const start = Math.max(0, idx - 80);
  const end   = Math.min(text.length, start + max);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

function buildTabHref(tab: Tab, params: { q: string; code: string }) {
  const p = new URLSearchParams({ tab });
  if (params.q) p.set('q', params.q);
  if (params.code) p.set('code', params.code);
  return `/search?${p}`;
}

/* ─── Main component ──────────────────────────────────────────────────────── */

export default async function SearchPage({ searchParams }: Props) {
  const {
    tab: tabParam,
    q: qParam,
    kw: kwParam,
    code: codeParam,
    page: pageParam,
  } = await searchParams;

  const tab: Tab = (['text', 'article'].includes(tabParam ?? '') ? tabParam : 'text') as Tab;
  const q        = (qParam?.trim() ?? '').slice(0, 200);   // max 200 chars
  const kw       = (kwParam?.trim() ?? '').slice(0, 200);
  const codeSlug = (codeParam ?? '').slice(0, 100);
  const page     = Math.max(1, Number(pageParam ?? 1));
  const perPage  = 20;

  // Charger les codes pour le dropdown
  const codesList = await getAllCodes();

  // Résoudre le code_id depuis le slug (ou id)
  let codeId: string | null = null;
  let selectedCodeName = '';
  if (codeSlug) {
    const found = codesList.find(c => c.id === codeSlug || c.slug === codeSlug);
    if (found) {
      codeId = found.id;
      selectedCodeName = found.title_ar;
    }
  }

  // Exécuter la recherche
  let result: { data: any[]; current_page: number; last_page: number; total: number } | null = null;

  if (tab === 'text' && q) {
    result = await searchByText(q, codeId, page, perPage);
  } else if (tab === 'article' && q) {
    result = await searchByNumber(q, codeId, page, perPage);
  }

  const hits       = result?.data ?? [];
  const pagination = result
    ? { current: result.current_page, last: result.last_page, total: result.total }
    : null;

  const activeQuery = q;
  const queryWords  = q
    .split(/[,،\-\s]+/)
    .filter((w: string) => w.length >= 2);

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'text',     label: 'بحث بالكلمات المفتاحية',  icon: <Search className="w-4 h-4" /> },
    { id: 'article',  label: 'بحث برقم المادة',         icon: <Hash className="w-4 h-4" /> },
  ];

  const paginationBase = () => {
    const p = new URLSearchParams({ tab });
    if (q) p.set('q', q);
    if (codeSlug) p.set('code', codeSlug);
    return p;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <BreadcrumbJsonLd
        items={[
          { name: 'الرئيسية', url: 'https://almudawwana-v3.vercel.app' },
          { name: 'البحث', url: 'https://almudawwana-v3.vercel.app/search' },
        ]}
      />
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        <h1 className="font-kufi text-2xl font-bold text-slate-900 mb-6">
          البحث في القوانين
        </h1>

        {/* ── Tab bar ─────────────────────────────────────────── */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-4">
          {tabs.map(t => (
            <a
              key={t.id}
              href={buildTabHref(t.id, { q, code: codeSlug })}
              className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium
                          py-2.5 px-3 rounded-lg transition-all
                          ${tab === t.id
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </a>
          ))}
        </div>

        {/* ── Tab 1: text / keyword search ────────────────────── */}
        {tab === 'text' && (
          <form method="GET" action="/search" className="space-y-3 mb-8">
            <input type="hidden" name="tab" value="text" />
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="ابحث بكلمة أو عدة كلمات مفتاحية..."
                  autoFocus
                  className="w-full pr-4 pl-12 py-3.5 text-sm border border-slate-300 rounded-xl
                             bg-white focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent placeholder:text-slate-400 shadow-sm"
                />
                <button type="submit"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                  <Search className="w-5 h-5" />
                </button>
              </div>
              <button type="submit"
                className="px-6 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-semibold
                           hover:bg-blue-700 transition-colors shadow-sm shrink-0">
                بحث
              </button>
            </div>
            <div className="max-w-xs">
              <SearchableSelect
                name="code"
                defaultValue={codeSlug}
                placeholder="— جميع القوانين —"
                options={codesList.map(c => ({ value: c.id, label: c.title_ar, sub: `${c.total_articles ?? 0} مادة` }))}
              />
            </div>
            <p className="text-xs text-slate-400">
              يعرض المواد التي تحتوي على 50% على الأقل من الكلمات المُدخلة. يمكنك إدخال عدة كلمات مفتاحية.
            </p>
            {!q && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-medium mb-2 text-xs text-blue-600">أمثلة :</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['القتل العمد', 'الحضانة', 'العقد الباطل', 'التطليق'].map(ex => (
                    <a key={ex} href={`/search?tab=text&q=${encodeURIComponent(ex)}`}
                      className="bg-white rounded-lg px-3 py-1.5 border border-blue-100 hover:border-blue-300">
                      {ex}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </form>
        )}

        {/* ── Tab 2: search by article number + code ──────────── */}
        {tab === 'article' && (
          <form method="GET" action="/search" className="space-y-3 mb-8">
            <input type="hidden" name="tab" value="article" />
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">القانون</label>
                <SearchableSelect
                  name="code"
                  defaultValue={codeSlug}
                  placeholder="— جميع القوانين —"
                  options={codesList.map(c => ({ value: c.id, label: c.title_ar, sub: `${c.total_articles ?? 0} مادة` }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">رقم الفصل / المادة</label>
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="مثال: 1 أو 25"
                  autoFocus
                  inputMode="numeric"
                  className="w-full sm:w-40 px-4 py-3 text-sm border border-slate-300 rounded-xl
                             bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm
                             placeholder:text-slate-400"
                />
              </div>
              <button type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold
                           hover:bg-blue-700 transition-colors shadow-sm">
                بحث
              </button>
            </div>
            <p className="text-xs text-slate-400">
              يعرض المادة المطلوبة + المواد المشابهة (مثال: 1 → 1, 1-1, 1.1, 1-2…)
            </p>
          </form>
        )}

        {/* ── Results header ──────────────────────────────────── */}
        {activeQuery && (
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            {pagination && pagination.total > 0 ? (
              <p className="text-sm text-slate-600">
                {tab === 'article' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-700">{pagination.total}</span>
                    &nbsp;نتيجة للمادة رقم&nbsp;
                    <span className="font-bold text-slate-900">&quot;{activeQuery}&quot;</span>
                    {selectedCodeName && <span className="text-slate-400"> في {selectedCodeName}</span>}
                  </span>
                ) : (
                  <span>
                    <span className="font-medium">{pagination.total}</span> نتيجة لـ&nbsp;
                    <span className="font-bold text-slate-900">&quot;{activeQuery}&quot;</span>
                    {selectedCodeName && <span className="text-slate-400"> في {selectedCodeName}</span>}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                لا توجد نتائج لـ <span className="font-semibold">&quot;{activeQuery}&quot;</span>
                {selectedCodeName && ` في ${selectedCodeName}`}
              </p>
            )}
            <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200">
              {tab === 'text' ? 'بحث نصي (50%)' : tab === 'article' ? 'بحث برقم' : 'كلمات مفتاحية (60%)'}
            </span>
          </div>
        )}

        {/* ── Results list ────────────────────────────────────── */}
        {hits.length > 0 ? (
          <div className="space-y-3">
            {hits.map((article: any) => (
              <Link
                key={article.id}
                href={`/codes/${(article.code as any)?.slug ?? article.code_id}/المادة-${article.number}`}
                className="block bg-white rounded-xl border border-slate-200 px-5 py-4
                           hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 text-xs font-bold text-blue-700 bg-blue-50
                                   px-2.5 py-1 rounded-lg mt-0.5 whitespace-nowrap">
                    م. {article.number}
                  </span>
                  <div className="flex-1 min-w-0">
                    {article.code && (
                      <p className="text-xs text-slate-400 mb-1 truncate">
                        {article.code.title_ar}
                      </p>
                    )}
                    <p className="text-slate-700 text-sm leading-relaxed text-arabic line-clamp-3">
                      {truncateAround(article.content_ar, queryWords)}
                    </p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-blue-400
                                         transition-colors shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        ) : activeQuery ? (
          <div className="text-center py-20 text-slate-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-slate-500">لا توجد نتائج</p>
            <p className="text-sm mt-1">
              {tab === 'article'
                ? 'تحقق من رقم المادة أو اختر قانوناً آخر'
                : 'جرّب كلمات مختلفة أو قلّل عدد الكلمات'}
            </p>
          </div>
        ) : null}

        {/* ── Pagination ──────────────────────────────────────── */}
        {pagination && pagination.last > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {page > 1 && (
              <Link
                href={`/search?${paginationBase()}&page=${page - 1}`}
                className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg
                           hover:bg-slate-50 hover:border-blue-300 transition-colors text-slate-700
                           flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4 rotate-180" />السابق
              </Link>
            )}
            <span className="text-sm text-slate-500 px-3">
              {page} / {pagination.last}
            </span>
            {page < pagination.last && (
              <Link
                href={`/search?${paginationBase()}&page=${page + 1}`}
                className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg
                           hover:bg-slate-50 hover:border-blue-300 transition-colors text-slate-700
                           flex items-center gap-1"
              >
                التالي<ChevronLeft className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
