'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, ChevronLeft, Search, X, BookOpen } from 'lucide-react';
import { COLOR_PALETTE, FALLBACK_PALETTE, getTypeIcon } from '@/lib/codeTypeUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublicCodeType {
  id: number;
  slug: string;
  name_ar: string;
  color: string;
  sort_order: number;
}

// ─── Highlight helper ─────────────────────────────────────────────────────────

function highlight(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CodesGrid({
  codes,
  codeTypes,
}: {
  codes: any[];
  codeTypes: PublicCodeType[];
}) {
  const searchParams   = useSearchParams();
  const [query, setQuery]           = useState('');
  const [activeType, setActiveType] = useState<string | null>(null);

  // Pre-select type from URL param ?type=slug
  useEffect(() => {
    const t = searchParams.get('type');
    if (t) setActiveType(t);
  }, [searchParams]);

  // slug → type lookup
  const typeMap = useMemo(
    () => Object.fromEntries(codeTypes.map(t => [t.slug, t])),
    [codeTypes],
  );

  // Visible codes (total_articles > 0)
  const visible = useMemo(
    () => codes.filter(c => (c.total_articles ?? 0) > 0),
    [codes],
  );

  // Count per type (for type cards)
  const countByType = useMemo(() => {
    const map: Record<string, number> = {};
    visible.forEach(c => { map[c.type] = (map[c.type] ?? 0) + 1; });
    return map;
  }, [visible]);

  // Types with ≥1 code, ordered by sort_order
  const activeTypes = useMemo(
    () => [...codeTypes]
      .sort((a, b) => a.sort_order - b.sort_order)
      .filter(t => (countByType[t.slug] ?? 0) > 0),
    [codeTypes, countByType],
  );

  // Filtered codes (by activeType + query)
  const filtered = useMemo(() => {
    let list = visible;
    if (activeType) list = list.filter(c => c.type === activeType);
    if (!query.trim()) return list;
    const q = query.trim().toLowerCase();
    return list.filter(c =>
      c.title_ar?.toLowerCase().includes(q) ||
      c.title_fr?.toLowerCase().includes(q) ||
      c.official_number?.toLowerCase().includes(q) ||
      (Array.isArray(c.keywords) && c.keywords.some((k: string) => k.toLowerCase().includes(q))),
    );
  }, [visible, activeType, query]);

  const activePalette = activeType
    ? (COLOR_PALETTE[typeMap[activeType]?.color ?? ''] ?? FALLBACK_PALETTE)
    : null;

  return (
    <div className="space-y-8">

      {/* ══ Type category cards ══════════════════════════════════════════ */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {activeTypes.map(ct => {
          const palette  = COLOR_PALETTE[ct.color] ?? FALLBACK_PALETTE;
          const Icon     = getTypeIcon(ct.slug, ct.name_ar);
          const isActive = activeType === ct.slug;

          return (
            <button
              key={ct.slug}
              onClick={() => setActiveType(isActive ? null : ct.slug)}
              className={`
                group flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200
                ${isActive
                  ? `${palette.activeBg} border-transparent shadow-lg scale-[1.03]`
                  : `bg-white ${palette.border} hover:shadow-md hover:scale-[1.02]`}
              `}
            >
              <div className={`
                w-14 h-14 rounded-full flex items-center justify-center transition-colors
                ${isActive ? 'bg-white/20' : palette.iconBg}
              `}>
                <Icon className={`w-7 h-7 ${isActive ? 'text-white' : palette.iconText}`} />
              </div>
              <span className={`font-kufi text-xs font-bold text-center leading-tight
                ${isActive ? 'text-white' : 'text-slate-800'}`}>
                {ct.name_ar}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full
                ${isActive ? 'bg-white/25 text-white' : `${palette.badge} ${palette.badgeText}`}`}>
                {countByType[ct.slug] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══ Active type header ═══════════════════════════════════════════ */}
      {activeType && typeMap[activeType] && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${activePalette!.border} ${activePalette!.badge}`}>
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${activePalette!.dot}`} />
          <span className={`font-kufi font-bold text-base ${activePalette!.badgeText}`}>
            {typeMap[activeType].name_ar}
          </span>
          <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
            {countByType[activeType] ?? 0} قانون
          </span>
          <button
            onClick={() => setActiveType(null)}
            className="mr-auto flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <X className="w-3.5 h-3.5" />
            عرض الكل
          </button>
        </div>
      )}

      {/* ══ Search bar ═══════════════════════════════════════════════════ */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ابحث بسرعة عن قانون أو مدونة..."
          className="w-full pr-11 pl-10 py-3 text-sm border border-slate-200 rounded-xl
                     bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                     focus:border-transparent placeholder:text-slate-400"
          dir="rtl"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full
                       text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="مسح البحث"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ══ Result count ═════════════════════════════════════════════════ */}
      {query && (
        <p className="text-sm text-slate-500 -mt-4">
          {filtered.length === 0
            ? 'لا توجد نتائج'
            : `${filtered.length} نتيجة لـ "${query}"`}
        </p>
      )}

      {/* ══ No results ═══════════════════════════════════════════════════ */}
      {filtered.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{query ? 'لا توجد قوانين تطابق بحثك' : 'لا توجد قوانين في هذا التصنيف'}</p>
          <button
            onClick={() => { setQuery(''); setActiveType(null); }}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            عرض جميع القوانين
          </button>
        </div>
      )}

      {/* ══ Codes grid ═══════════════════════════════════════════════════ */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((code: any) => {
            const ct      = typeMap[code.type];
            const palette = ct ? (COLOR_PALETTE[ct.color] ?? FALLBACK_PALETTE) : FALLBACK_PALETTE;
            const label   = ct?.name_ar ?? code.type;

            return (
              <Link
                key={code.id}
                href={`/codes/${code.slug}`}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm
                           hover:shadow-md hover:border-blue-300 transition-all duration-200 p-5
                           flex flex-col"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                                   transition-colors ${palette.iconBg} group-hover:opacity-80`}>
                    <FileText className={`w-4 h-4 ${palette.iconText}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug
                                   group-hover:text-blue-700 transition-colors">
                      {highlight(code.title_ar, query)}
                    </h3>
                    {code.title_fr && (
                      <p className="text-xs text-slate-400 truncate mt-0.5" dir="ltr">
                        {highlight(code.title_fr, query)}
                      </p>
                    )}
                  </div>
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400
                                         transition-colors shrink-0 mt-0.5" />
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${palette.badge} ${palette.badgeText}`}>
                    {label}
                  </span>
                  {code.official_number && (
                    <span className="text-xs bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200"
                          dir="ltr">
                      {highlight(code.official_number, query)}
                    </span>
                  )}
                  {(code.total_articles ?? 0) > 0 && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {code.total_articles} مادة
                    </span>
                  )}
                  {code.promulgation_date && (
                    <span className="text-xs text-slate-400 mr-auto">
                      {new Date(code.promulgation_date).getFullYear()}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
