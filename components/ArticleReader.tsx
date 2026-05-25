'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Scale, ExternalLink, Eye, MessageSquare, BookMarked,
  ChevronLeft, ChevronRight, Moon, Sun, Copy, Check,
} from 'lucide-react';
import ShareButton from '@/components/ShareButton';
import ReportButton from '@/components/ReportButton';

// ─── Types ────────────────────────────────────────────────────────────────────

type FontKey = 'sm' | 'md' | 'lg' | 'xl';

const FONT_STEPS: { key: FontKey; textCls: string; lhCls: string }[] = [
  { key: 'sm', textCls: 'text-sm',          lhCls: 'leading-[2.1]' },
  { key: 'md', textCls: 'text-[0.95rem]',   lhCls: 'leading-[2.2]' },
  { key: 'lg', textCls: 'text-lg',          lhCls: 'leading-[2.1]' },
  { key: 'xl', textCls: 'text-xl',          lhCls: 'leading-[2]'   },
];

interface NeighborArticle { number: string }

interface StatusMeta { label: string; cls: string }

interface ArticleData {
  id:            string;
  number:        string;
  content_ar?:   string | null;
  content_fr?:   string | null;
  status:        string;
  view_count:    number;
  comment_count: number;
  section?:      { title_ar?: string | null } | null;
  tags?:         { id: string; name_ar: string }[];
}

interface Props {
  article:    ArticleData;
  codeName:   string;
  codeSlug:   string;
  statusMeta: StatusMeta;
  prev:       NeighborArticle | null;
  next:       NeighborArticle | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ArticleReader({
  article, codeName, codeSlug, statusMeta, prev, next,
}: Props) {
  const router = useRouter();

  // ── state ──────────────────────────────────────────────────────────────────
  const [fontKey, setFontKey]       = useState<FontKey>('md');
  const [dark, setDark]             = useState(false);
  const [manualDark, setManualDark] = useState(false);

  // copy popup
  const [popup, setPopup]     = useState<{ x: number; y: number } | null>(null);
  const [selText, setSelText] = useState('');
  const [copied, setCopied]   = useState(false);

  // swipe
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // ── init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('article_font') as FontKey | null;
    if (saved && FONT_STEPS.some(s => s.key === saved)) setFontKey(saved);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setDark(mq.matches);

    const handler = (e: MediaQueryListEvent) => {
      if (!manualDark) setDark(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [manualDark]);

  // close copy popup on scroll
  useEffect(() => {
    const close = () => setPopup(null);
    window.addEventListener('scroll', close, { passive: true });
    return () => window.removeEventListener('scroll', close);
  }, []);

  // ── actions ────────────────────────────────────────────────────────────────
  const changeFont = (k: FontKey) => {
    setFontKey(k);
    localStorage.setItem('article_font', k);
  };

  const toggleDark = () => {
    setManualDark(true);
    setDark(d => !d);
  };

  const navigate = useCallback((art: NeighborArticle | null) => {
    if (art) router.push(`/codes/${codeSlug}/المادة-${art.number}`);
  }, [router, codeSlug]);

  // ── swipe ──────────────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // ignore vertical scrolling
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (Math.abs(dx) < 65) return;
    // swipe left → next; swipe right → prev
    if (dx < 0) navigate(next);
    else        navigate(prev);
  };

  // ── text selection → copy popup ────────────────────────────────────────────
  const onMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { setPopup(null); return; }
    const text = sel.toString().trim();
    if (text.length < 3) { setPopup(null); return; }
    setSelText(text);
    const range = sel.getRangeAt(0);
    const rect  = range.getBoundingClientRect();
    setPopup({ x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 54 });
  };

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(selText);
      setCopied(true);
      setTimeout(() => { setCopied(false); setPopup(null); }, 1800);
    } catch { /* ignore */ }
  };

  // ── theme helpers ──────────────────────────────────────────────────────────
  const font = FONT_STEPS.find(s => s.key === fontKey) ?? FONT_STEPS[1];

  const dk = {
    card:    dark ? 'bg-slate-900' : 'bg-white',
    bar:     dark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600',
    pill:    dark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-50 text-blue-600',
    toolbar: dark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50/80 border-slate-100',
    fmtBg:   dark ? 'bg-slate-700' : 'bg-white border border-slate-200',
    fmtBtn:  (on: boolean) => on
               ? 'bg-blue-600 text-white'
               : dark ? 'text-slate-300 hover:text-white hover:bg-slate-600'
                      : 'text-slate-500 hover:text-slate-800',
    darkBtn: dark
               ? 'bg-slate-700 text-amber-300 hover:bg-slate-600'
               : 'bg-white border border-slate-200 text-slate-500 hover:text-amber-500',
    navBtn:  (enabled: boolean) =>
               !enabled ? 'opacity-25 cursor-not-allowed' :
               dark ? 'hover:bg-slate-700' : 'hover:bg-blue-50 hover:text-blue-600',
    content: dark ? 'text-slate-100' : 'text-slate-800',
    frBorder:dark ? 'border-slate-700' : 'border-slate-100',
    frLabel: dark ? 'text-slate-400' : 'text-slate-500',
    frText:  dark ? 'text-slate-300' : 'text-slate-600',
    tags:    dark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100',
    tag:     dark ? 'bg-blue-900/50 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-100',
    footer:  dark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500',
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <article
      className={`${dk.card} sm:rounded-2xl border-0 sm:border overflow-hidden
                  ${dark ? 'sm:border-slate-700 shadow-none' : 'sm:border-slate-200 sm:shadow-sm'}`}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-l from-blue-700 to-blue-800 px-4 py-5 sm:px-8 sm:py-7">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-white/15 rounded-lg sm:rounded-xl
                          flex items-center justify-center shrink-0 mt-0.5">
            <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-blue-200 text-[11px] sm:text-xs font-medium mb-0.5 sm:mb-1 truncate">
              {codeName}
            </p>
            <h1 className="font-kufi text-xl sm:text-2xl font-bold text-white leading-tight">
              المادة {article.number}
            </h1>
            {article.section?.title_ar && (
              <p className="text-blue-100 text-xs sm:text-sm mt-1.5 sm:mt-2 leading-relaxed line-clamp-2">
                {article.section.title_ar}
              </p>
            )}
          </div>
          <span
            className={`shrink-0 text-[10px] sm:text-xs font-medium px-2 py-1 sm:px-3 sm:py-1.5
                        rounded-full border ${statusMeta.cls}`}
            style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
          >
            {statusMeta.label}
          </span>
        </div>
      </div>

      {/* ── Navigation bar ─────────────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-2 py-2 border-b text-sm ${dk.bar}`}
           dir="ltr">
        {/* ← prev */}
        <button
          onClick={() => navigate(prev)}
          disabled={!prev}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${dk.navBtn(!!prev)}`}
          aria-label="المادة السابقة"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span className="text-xs font-medium">
            {prev ? `م. ${prev.number}` : '—'}
          </span>
        </button>

        {/* current */}
        <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${dk.pill}`}>
          م. {article.number}
        </span>

        {/* next → */}
        <button
          onClick={() => navigate(next)}
          disabled={!next}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${dk.navBtn(!!next)}`}
          aria-label="المادة التالية"
        >
          <span className="text-xs font-medium">
            {next ? `م. ${next.number}` : '—'}
          </span>
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* ── Reading toolbar ────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-2 px-4 py-2 border-b ${dk.toolbar}`}>
        <span className={`text-[11px] ${dk.frLabel}`}>حجم الخط</span>

        {/* font size buttons: ص أ ك ك (small → xl) */}
        <div className={`flex items-center gap-0.5 p-0.5 rounded-lg ${dk.fmtBg}`}>
          {FONT_STEPS.map((step, i) => (
            <button
              key={step.key}
              onClick={() => changeFont(step.key)}
              className={`px-2 py-0.5 rounded-md transition-colors font-bold leading-none
                         ${dk.fmtBtn(step.key === fontKey)}`}
              style={{ fontSize: `${0.6 + i * 0.12}rem` }}
              title={step.key}
            >
              أ
            </button>
          ))}
        </div>

        {/* dark mode toggle */}
        <button
          onClick={toggleDark}
          className={`mr-auto p-1.5 rounded-lg transition-colors ${dk.darkBtn}`}
          title={dark ? 'وضع النهار' : 'وضع الليل'}
        >
          {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ── Article text ───────────────────────────────────────────────────── */}
      <div
        className={`px-4 py-6 sm:px-8 sm:py-9 select-text ${dk.card}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseUp={onMouseUp}
      >
        <div
          className={`${font.textCls} ${font.lhCls} text-arabic whitespace-pre-wrap
                      max-w-none sm:max-w-[70ch] ${dk.content}`}
        >
          {article.content_ar ?? ''}
        </div>

        {article.content_fr && (
          <div className={`mt-8 pt-6 border-t ${dk.frBorder}`}>
            <p className={`text-xs font-medium mb-3 uppercase tracking-wide ${dk.frLabel}`} dir="ltr">
              Version française
            </p>
            <p className={`text-sm leading-relaxed ${dk.frText}`} dir="ltr">
              {article.content_fr}
            </p>
          </div>
        )}
      </div>

      {/* ── Tags ───────────────────────────────────────────────────────────── */}
      {article.tags && article.tags.length > 0 && (
        <div className={`px-8 py-4 border-t ${dk.tags}`}>
          <div className="flex flex-wrap gap-2">
            {article.tags.map(tag => (
              <span key={tag.id}
                    className={`text-xs px-3 py-1 rounded-full border ${dk.tag}`}>
                {tag.name_ar}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer meta ────────────────────────────────────────────────────── */}
      <div className={`px-4 sm:px-8 py-4 border-t ${dk.footer}`}>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />{article.view_count} مشاهدة
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />{article.comment_count} تعليق
          </span>
          <span className="flex items-center gap-1.5">
            <BookMarked className="w-3.5 h-3.5" />المصدر :
            <a href="https://www.sgg.gov.ma" target="_blank" rel="noopener noreferrer"
               className="text-blue-600 hover:underline flex items-center gap-0.5">
              sgg.gov.ma <ExternalLink className="w-3 h-3" />
            </a>
          </span>
          <ShareButton
            variant="icon"
            title={`المادة ${article.number} — ${codeName}`}
            text={`المادة ${article.number} من ${codeName} — المدوّنة`}
            className="mr-auto"
          />
          <ReportButton articleId={article.id} articleNumber={article.number} />
        </div>
      </div>

      {/* ── Copy popup ─────────────────────────────────────────────────────── */}
      {popup && (
        <div
          className="fixed z-50 -translate-x-1/2 pointer-events-auto"
          style={{ left: popup.x, top: popup.y }}
          onMouseDown={e => e.preventDefault()}
        >
          <button
            onClick={doCopy}
            className="flex items-center gap-1.5 bg-slate-900 text-white text-xs
                       px-3 py-1.5 rounded-full shadow-xl hover:bg-slate-700 transition-colors"
          >
            {copied
              ? <Check className="w-3 h-3 text-emerald-400" />
              : <Copy  className="w-3 h-3" />}
            {copied ? 'تم النسخ ✓' : 'نسخ'}
          </button>
          <div className="flex justify-center mt-0.5">
            <div className="w-0 h-0 border-x-4 border-x-transparent border-t-[5px] border-t-slate-900" />
          </div>
        </div>
      )}
    </article>
  );
}
