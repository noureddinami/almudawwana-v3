'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  listOfflineCodes, getOfflineCode, deleteOfflineCode,
  searchOfflineArticles,
  type OfflineArticle,
} from '@/lib/cache';
import {
  WifiOff, Download, Trash2, Search, ChevronLeft, Scale,
  FileText, Clock, ChevronDown, ChevronUp, X, Eye,
  BookMarked, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface OfflineCodeMeta {
  id: string;
  title_ar: string;
  title_fr?: string | null;
  downloaded_at: number;
  total_articles: number;
}

type View = 'codes' | 'articles' | 'article';

export default function OfflinePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    }>
      <OfflinePage />
    </Suspense>
  );
}

function OfflinePage() {
  const searchParams = useSearchParams();
  const [codes, setCodes] = useState<OfflineCodeMeta[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation state
  const [view, setView] = useState<View>('codes');
  const [activeCodeId, setActiveCodeId] = useState<string | null>(null);
  const [activeCodeTitle, setActiveCodeTitle] = useState('');
  const [articles, setArticles] = useState<OfflineArticle[]>([]);

  // Article detail
  const [activeArticle, setActiveArticle] = useState<OfflineArticle | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OfflineArticle[] | null>(null);

  // Load codes + handle deep link from query params
  useEffect(() => {
    loadCodes();
  }, []);

  useEffect(() => {
    const codeParam = searchParams.get('code');
    const articleParam = searchParams.get('article');
    if (codeParam) {
      openCodeById(codeParam, articleParam);
    }
  }, [searchParams]);

  async function loadCodes() {
    setLoading(true);
    const list = await listOfflineCodes();
    setCodes(list as OfflineCodeMeta[]);
    setLoading(false);
  }

  async function openCodeById(codeId: string, articleId?: string | null) {
    const code = await getOfflineCode(codeId);
    if (!code) {
      toast.error('هذا القانون غير محمّل على جهازك');
      return;
    }
    setActiveCodeId(codeId);
    setActiveCodeTitle(code.title_ar);
    setArticles(code.articles);
    setSearchQuery('');
    setSearchResults(null);

    if (articleId) {
      const art = code.articles.find(a => a.id === articleId);
      if (art) {
        setActiveArticle(art);
        setView('article');
        return;
      }
    }
    setView('articles');
  }

  async function openCode(codeId: string, title: string) {
    const code = await getOfflineCode(codeId);
    if (!code) {
      toast.error('لم يتم العثور على البيانات');
      return;
    }
    setActiveCodeId(codeId);
    setActiveCodeTitle(title);
    setArticles(code.articles);
    setSearchQuery('');
    setSearchResults(null);
    setActiveArticle(null);
    setView('articles');
  }

  function openArticle(article: OfflineArticle) {
    setActiveArticle(article);
    setView('article');
    window.scrollTo(0, 0);
  }

  async function handleSearch() {
    if (!activeCodeId || !searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const results = await searchOfflineArticles(activeCodeId, searchQuery);
    setSearchResults(results);
  }

  async function handleDelete(codeId: string) {
    await deleteOfflineCode(codeId);
    setCodes(prev => prev.filter(c => c.id !== codeId));
    if (activeCodeId === codeId) {
      setView('codes');
      setActiveCodeId(null);
      setArticles([]);
      setActiveArticle(null);
    }
    toast.success('تم حذف النسخة المحلية');
  }

  function goBackToArticles() {
    setActiveArticle(null);
    setView('articles');
  }

  function goBackToCodes() {
    setActiveCodeId(null);
    setArticles([]);
    setSearchQuery('');
    setSearchResults(null);
    setActiveArticle(null);
    setView('codes');
  }

  // Navigate to previous/next article
  function navigateArticle(direction: 'prev' | 'next') {
    if (!activeArticle) return;
    const idx = articles.findIndex(a => a.id === activeArticle.id);
    if (idx === -1) return;
    const newIdx = direction === 'prev' ? idx - 1 : idx + 1;
    if (newIdx >= 0 && newIdx < articles.length) {
      setActiveArticle(articles[newIdx]);
      window.scrollTo(0, 0);
    }
  }

  const displayArticles = searchResults ?? articles;

  // ═══════════════════════════════════════════════════════════
  // VIEW 3: Article detail (full screen)
  // ═══════════════════════════════════════════════════════════
  if (view === 'article' && activeArticle) {
    const idx = articles.findIndex(a => a.id === activeArticle.id);
    const hasPrev = idx > 0;
    const hasNext = idx < articles.length - 1;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />

        {/* Breadcrumb */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-3 py-2.5">
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
              <button onClick={goBackToCodes} className="hover:text-blue-600 transition-colors">
                المحمّلة
              </button>
              <ChevronLeft className="w-3 h-3 text-slate-300" />
              <button onClick={goBackToArticles} className="hover:text-blue-600 transition-colors truncate max-w-[160px]">
                {activeCodeTitle}
              </button>
              <ChevronLeft className="w-3 h-3 text-slate-300" />
              <span className="text-slate-800 font-medium">م. {activeArticle.number}</span>
            </nav>
          </div>
        </div>

        {/* Article content */}
        <div className="max-w-4xl mx-auto px-0 sm:px-4 py-0 sm:py-8 flex-1 w-full">
          <article className="bg-white sm:rounded-2xl border-0 sm:border border-slate-200 shadow-none sm:shadow-sm overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-l from-green-700 to-green-800 px-4 py-5 sm:px-8 sm:py-7">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 bg-white/15 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-green-200 text-[11px] sm:text-xs font-medium mb-0.5 truncate">
                    {activeCodeTitle}
                  </p>
                  <h1 className="font-kufi text-xl sm:text-2xl font-bold text-white leading-tight">
                    المادة {activeArticle.number}
                  </h1>
                  {activeArticle.section_title && (
                    <p className="text-green-100 text-xs sm:text-sm mt-1.5 leading-relaxed">
                      {activeArticle.section_title}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-[10px] sm:text-xs font-medium px-2 py-1 rounded-full
                                 bg-green-100 text-green-800 border border-green-300">
                  <WifiOff className="w-3 h-3 inline ml-1" />
                  محلي
                </span>
              </div>
            </div>

            {/* Article text */}
            <div className="px-4 py-6 sm:px-8 sm:py-9">
              <div className="text-slate-800 text-[0.95rem] sm:text-[1.05rem] leading-[2.2] sm:leading-[2.3]
                              text-arabic whitespace-pre-wrap max-w-none sm:max-w-[70ch]">
                {activeArticle.content_ar}
              </div>

              {activeArticle.content_fr && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide" dir="ltr">
                    Version française
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed" dir="ltr">
                    {activeArticle.content_fr}
                  </p>
                </div>
              )}
            </div>
          </article>

          {/* Prev / Next navigation */}
          <div className="mt-4 flex items-center justify-between gap-3 px-1">
            {hasPrev ? (
              <button onClick={() => navigateArticle('prev')}
                className="flex items-center gap-1.5 text-sm text-slate-600 bg-white border border-slate-200
                           px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors active:scale-95"
              >
                <ArrowRight className="w-4 h-4" />
                م. {articles[idx - 1].number}
              </button>
            ) : <div />}

            <span className="text-xs text-slate-400">{idx + 1} / {articles.length}</span>

            {hasNext ? (
              <button onClick={() => navigateArticle('next')}
                className="flex items-center gap-1.5 text-sm text-slate-600 bg-white border border-slate-200
                           px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors active:scale-95"
              >
                م. {articles[idx + 1].number}
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            ) : <div />}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // VIEW 2: Articles list (inside a code)
  // ═══════════════════════════════════════════════════════════
  if (view === 'articles' && activeCodeId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />

        <div className="bg-white border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <button onClick={goBackToCodes}
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-3 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
              العودة
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                <WifiOff className="w-4 h-4 text-green-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-kufi text-base font-bold text-slate-900 truncate">{activeCodeTitle}</h1>
                <p className="text-xs text-slate-400">
                  {displayArticles.length} مادة
                  {searchResults !== null && ' (نتائج البحث)'}
                  {' '}— وضع بدون إنترنت
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="mt-3 flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث في مواد هذا القانون..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-full pr-9 pl-3 py-2 text-sm border border-slate-200 rounded-lg
                             focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium
                           hover:bg-blue-700 transition-colors active:scale-95 shrink-0"
              >
                بحث
              </button>
            </div>
          </div>
        </div>

        <main className="max-w-3xl mx-auto px-4 py-4 flex-1 w-full">
          {displayArticles.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>لا توجد نتائج</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayArticles.map(article => (
                <button
                  key={article.id}
                  onClick={() => openArticle(article)}
                  className="w-full block bg-white rounded-xl border border-slate-200 px-4 py-3.5
                             hover:border-blue-300 hover:shadow-sm transition-all duration-150
                             active:scale-[0.99] active:bg-slate-50 text-right"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="shrink-0 text-[11px] font-bold text-blue-700 bg-blue-50
                                     px-2 py-0.5 rounded-lg mt-0.5 whitespace-nowrap">
                      م. {article.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      {article.section_title && (
                        <p className="text-[11px] text-slate-400 mb-0.5 truncate">{article.section_title}</p>
                      )}
                      <p className="text-slate-600 text-[13px] leading-relaxed line-clamp-3">
                        {article.content_ar.slice(0, 160)}
                        {article.content_ar.length > 160 && '…'}
                      </p>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // VIEW 1: Code list
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="bg-gradient-to-l from-green-700 to-green-800 text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <WifiOff className="w-5 h-5" />
            </div>
            <h1 className="font-kufi text-xl font-bold">القراءة بدون إنترنت</h1>
          </div>
          <p className="text-green-200 text-sm">
            القوانين المحمّلة على جهازك — متاحة في أي وقت بدون اتصال
          </p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6 flex-1 w-full">
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            جارٍ التحقق...
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-20">
            <Download className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium mb-2">لا توجد قوانين محمّلة</p>
            <p className="text-sm text-slate-400 mb-6">
              اذهب إلى أي قانون واضغط على &laquo;تحميل للقراءة بدون إنترنت&raquo;
            </p>
            <Link
              href="/codes"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl
                         text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Scale className="w-4 h-4" />
              تصفح القوانين
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {codes.map(code => (
              <div key={code.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => openCode(code.id, code.title_ar)}
                  className="w-full flex items-center gap-3 px-4 py-4 text-right
                             hover:bg-slate-50 transition-colors active:scale-[0.99]"
                >
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-green-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm">{code.title_ar}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span>{code.total_articles} مادة</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(code.downloaded_at).toLocaleDateString('ar-MA')}
                      </span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
                <div className="border-t border-slate-100 px-4 py-2 flex justify-end">
                  <button
                    onClick={() => handleDelete(code.id)}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700
                               hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
