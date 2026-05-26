'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { CHAMBER_LABELS } from '@/lib/jurisprudence';

export interface JurisFilters {
  search:  string
  chamber: string
  year:    string
}

interface Props {
  initial?: Partial<JurisFilters>
  onChange: (f: JurisFilters) => void
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 20 }, (_, i) => currentYear - i);

const CHAMBERS = [
  { slug: 'civil',          label: CHAMBER_LABELS.civil          },
  { slug: 'criminal',       label: CHAMBER_LABELS.criminal       },
  { slug: 'social',         label: CHAMBER_LABELS.social         },
  { slug: 'commercial',     label: CHAMBER_LABELS.commercial     },
  { slug: 'administrative', label: CHAMBER_LABELS.administrative },
  { slug: 'other',          label: CHAMBER_LABELS.other          },
];

export default function FiltersBar({ initial = {}, onChange }: Props) {
  const [search,  setSearch]  = useState(initial.search  ?? '');
  const [chamber, setChamber] = useState(initial.chamber ?? '');
  const [year,    setYear]    = useState(initial.year    ?? '');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => onChange({ search, chamber, year }), 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, chamber, year]);

  const activeCount = [search, chamber, year].filter(Boolean).length;

  const reset = () => { setSearch(''); setChamber(''); setYear(''); };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 space-y-3" dir="rtl">
      <div className="flex flex-wrap gap-2 items-center">

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث برقم الملف أو موضوع القرار..."
            className="w-full pr-9 pl-3 py-2 text-sm border border-slate-200 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Chamber */}
        <select
          value={chamber}
          onChange={e => setChamber(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
        >
          <option value="">كل الغرف</option>
          {CHAMBERS.map(c => (
            <option key={c.slug} value={c.slug}>{c.label}</option>
          ))}
        </select>

        {/* Year */}
        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
        >
          <option value="">كل السنوات</option>
          {YEARS.map(y => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>

        {/* Reset */}
        {activeCount > 0 && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            مسح الفلاتر ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}
