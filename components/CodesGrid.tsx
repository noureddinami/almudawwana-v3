'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FileText, ChevronLeft, Search, X, BookOpen } from 'lucide-react';

const TYPE_ORDER = ['constitution', 'organic_law', 'ordinary_law', 'code', 'decree_law'];

const TYPE_META: Record<string, { label: string; plural: string; cls: string; dot: string }> = {
  constitution: { label: 'دستور',        plural: 'الدساتير',            cls: 'bg-amber-50  text-amber-700',   dot: 'bg-amber-400'  },
  organic_law:  { label: 'قانون تنظيمي', plural: 'القوانين التنظيمية',  cls: 'bg-violet-50 text-violet-700',  dot: 'bg-violet-400' },
  ordinary_law: { label: 'قانون',        plural: 'القوانين العادية',     cls: 'bg-teal-50   text-teal-700',    dot: 'bg-teal-400'   },
  code:         { label: 'مدونة',        plural: 'المدونات',             cls: 'bg-blue-50   text-blue-700',    dot: 'bg-blue-400'   },
  decree_law:   { label: 'مرسوم بقانون', plural: 'المراسيم بقوانين',    cls: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400'  },
};

function highlight(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded-sm">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function CodesGrid({ codes }: { codes: any[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return codes;
    const q = query.trim().toLowerCase();
    return codes.filter(c =>
      c.title_ar?.toLowerCase().includes(q) ||
      c.title_fr?.toLowerCase().includes(q) ||
      c.official_number?.toLowerCase().includes(q) ||
      (Array.isArray(c.keywords) && c.keywords.some((k: string) => k.toLowerCase().includes(q)))
    );
  }, [codes, query]);

  const grouped = useMemo(() => {
    const order = [...TYPE_ORDER];
    // add unknown types at the end
    filtered.forEach(c => { if (!order.includes(c.type)) order.push(c.type); });

    return order.reduce<Record<string, any[]>>((acc, type) => {
      const items = filtered.filter(c => c.type === type);
      if (items.length) acc[type] = items;
      return acc;
    }, {});
  }, [filtered]);

  return (
    <div className="space-y-12">
      {/* ── Search bar ──────────────────────────────────────── */}
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

      {/* ── Result count when filtering ────────────────────── */}
      {query && (
        <p className="text-sm text-slate-500 -mt-8">
          {filtered.length === 0
            ? 'لا توجد نتائج'
            : `${filtered.length} نتيجة لـ "${query}"`}
        </p>
      )}

      {/* ── No results ─────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>لا توجد قوانين تطابق بحثك</p>
          <button
            onClick={() => setQuery('')}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            عرض جميع القوانين
          </button>
        </div>
      )}

      {/* ── Grouped sections ───────────────────────────────── */}
      {Object.entries(grouped).map(([type, items]) => {
        const meta = TYPE_META[type] ?? {
          label: type, plural: type,
          cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400',
        };
        return (
          <section key={type} id={query ? undefined : type}>
            <div className="flex items-center gap-3 mb-5">
              <span className={`w-3 h-3 rounded-full shrink-0 ${meta.dot}`} />
              <h2 className="font-kufi text-xl font-bold text-slate-900">{meta.plural}</h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                {items.length}
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((code: any) => (
                <Link
                  key={code.id}
                  href={`/codes/${code.slug}`}
                  className="group bg-white rounded-2xl border border-slate-200 shadow-sm
                             hover:shadow-md hover:border-blue-300 transition-all duration-200 p-5
                             flex flex-col"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center
                                    group-hover:bg-blue-100 transition-colors shrink-0">
                      <FileText className="w-4 h-4 text-blue-600" />
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
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.cls}`}>
                      {meta.label}
                    </span>
                    {code.official_number && (
                      <span className="text-xs bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200" dir="ltr">
                        {highlight(code.official_number, query)}
                      </span>
                    )}
                    {code.total_articles > 0 ? (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {code.total_articles} مادة
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">قريباً</span>
                    )}
                    {code.promulgation_date && (
                      <span className="text-xs text-slate-400 mr-auto">
                        {new Date(code.promulgation_date).getFullYear()}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
