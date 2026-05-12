import type { ReactNode } from 'react';
import Link from 'next/link';
import { articles as articlesApi, codes } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, ChevronLeft, BookOpen, Hash, AlignLeft, Tags } from 'lucide-react';

// export const revalidate - removed for testing

type Tab = 'text' | 'article' | 'keywords';

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

async function getCodes() {
  try {
    const first = await codes.list(1);
    let list = first.data ?? [];
    for (let p = 2; p <= (first.last_page ?? 1); p++) {
      const next = await codes.list(p);
      list = list.concat(next.data ?? []);
    }
    return list.filter((c: any) => c.total_articles > 0);
  } catch {
    return [];
  }
}

async function doSearch(params: {
  tab: Tab;
  q: string;
  kw: string;
  code: string;
  page: number;
}) {
  try {
    const { tab, q, kw, code, page } = params;
    if (tab === 'keywords' && kw) {
      return await articlesApi.searchKeywords(kw, page, 20, code || undefined);
    }
    if ((tab === 'text' || tab === 'article') && q) {
      return await articlesApi.search(q, page, 20, code || undefined);
    }
    return null;
  } catch {
    return null;
  }
}

function truncateAround(text: string, query: string, max = 280): string {
  if (!text) return '';
  const words = query.split(/[\s,،]+/).filter(w => w.length > 1);
  let idx = -1;
  for (const w of words) {
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

function buildTabHref(tab: Tab, params: { q: string; kw: string; code: string }) {
  const p = new URLSearchParams({ tab });
  if (tab === 'text' && params.q)      p.set('q', params.q);
  if (tab === 'article' && params.q)   { p.set('q', params.q); if (params.code) p.set('code', params.code); }
  if (tab === 'keywords' && params.kw) { p.set('kw', params.kw); if (params.code) p.set('code', params.code); }
  return `/search?${p}`;
}

function CodeSelect({ codesList, selected, name = 'code' }: {
  codesList: any[];
  selected: string;
  name?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={selected}
      className="text-sm border border-slate-300 rounded-xl px-3 py-3 bg-white
                 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
    >
      <option value="">— جميع القوانين —</option>
      {codesList.map((c: any) => (
        <option key={c.slug} value={c.slug}>{c.title_ar}</option>
      ))}
    </select>
  );
}

export default async function SearchPage({ searchParams }: Props) {
  const {
    tab: tabParam,
    q: qParam,
    kw: kwParam,
    code: codeParam,
    page: pageParam,
  } = await searchParams;

  const tab: Tab = (tabParam as Tab) || 'text';
  const q        = qParam?.trim() ?? '';
  const kw       = kwParam?.trim() ?? '';
  const code     = codeParam ?? '';
  const page     = Number(pageParam ?? 1);

  const [result, codesList] = await Promise.all([
    doSearch({ tab, q, kw, code, page }),
    getCodes(),
  ]);

  const hits       = result?.data ?? [];
  const pagination = result
    ? { current: result.current_page, last: result.last_page, total: result.total }
    : null;

  const activeQuery   = tab === 'keywords' ? kw : q;
  const selectedCodeName = codesList.find((c: any) => c.slug === code)?.title_ar ?? '';

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'text',     label: 'بحث بالنص',              icon: <AlignLeft className="w-4 h-4" /> },
    { id: 'article',  label: 'بحث برقم الفصل',          icon: <Hash className="w-4 h-4" /> },
    { id: 'keywords', label: 'بحث بكلمات مفتاحية',      icon: <Tags className="w-4 h-4" /> },
  ];

  // Build pagination URLs
  const paginationBase = () => {
    const p = new URLSearchParams({ tab });
    if (tab === 'keywords') { if (kw) p.set('kw', kw); }
    else { if (q) p.set('q', q); }
    if (code) p.set('code', code);
    return p;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
              href={buildTabHref(t.id, { q, kw, code })}
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

        {/* ── Tab 1: text search ──────────────────────────────── */}
        {tab === 'text' && (
          <form method="GET" action="/search" className="space-y-3 mb-8">
            <input type="hidden" name="tab" value="text" />
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="ابحث بالنص الحر في جميع القوانين..."
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
                <CodeSelect codesList={codesList} selected={code} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">رقم الفصل / المادة</label>
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="مثال: 25 أو 25 مكرر"
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
            {!q && (
              <p className="text-xs text-slate-400 pt-1">
                اختر قانوناً واكتب رقم الفصل للانتقال مباشرة إليه.
              </p>
            )}
          </form>
        )}

        {/* ── Tab 3: multi-keyword search + code ──────────────── */}
        {tab === 'keywords' && (
          <form method="GET" action="/search" className="space-y-3 mb-8">
            <input type="hidden" name="tab" value="keywords" />
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-3 items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">القانون</label>
                <CodeSelect codesList={codesList} selected={code} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">
                  الكلمات المفتاحية
                  <span className="mr-1 text-slate-400 font-normal">(افصل بينها بفاصلة أو مسافة)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="kw"
                    defaultValue={kw}
                    placeholder="مثال: ميراث، طلاق، حضانة"
                    autoFocus
                    className="w-full pr-4 pl-10 py-3 text-sm border border-slate-300 rounded-xl
                               bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm
                               placeholder:text-slate-400"
                  />
                  <Tags className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
              <button type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold
                           hover:bg-blue-700 transition-colors shadow-sm">
                بحث
              </button>
            </div>
            {kw && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {kw.split(/[,،\s]+/).filter(w => w.length >= 2).map((word, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1
                                           rounded-full border border-blue-100">
                    {word}
                  </span>
                ))}
              </div>
            )}
            {!kw && (
              <p className="text-xs text-slate-400 pt-1">
                يمكنك الجمع بين عدة كلمات — تُعرض المواد التي تحتوي على أيٍّ منها.
              </p>
            )}
          </form>
        )}

        {/* ── Results header ──────────────────────────────────── */}
        {activeQuery && (
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            {pagination ? (
              <p className="text-sm text-slate-600">
                {tab === 'article' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-700">{pagination.total}</span>
                    &nbsp;نتيجة للفصل رقم&nbsp;
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
              {tab === 'text' ? 'بحث نصي' : tab === 'article' ? 'بحث برقم' : 'كلمات مفتاحية'}
            </span>
          </div>
        )}

        {/* ── Results list ────────────────────────────────────── */}
        {hits.length > 0 ? (
          <div className="space-y-3">
            {hits.map((article: any) => {
              const codeSlug = article.code?.slug ?? '#';
              return (
                <Link
                  key={article.id}
                  href={`/codes/${codeSlug}/articles/${encodeURIComponent(article.slug)}`}
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
                        {truncateAround(article.content_ar, activeQuery)}
                      </p>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-blue-400
                                           transition-colors shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : activeQuery ? (
          <div className="text-center py-20 text-slate-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-slate-500">لا توجد نتائج</p>
            <p className="text-sm mt-1">
              {tab === 'article'
                ? 'تحقق من رقم الفصل أو اختر قانوناً آخر'
                : tab === 'keywords'
                ? 'جرّب كلمات أخرى أو قلّل عددها'
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
