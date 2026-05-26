'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import DecisionCard from '@/components/jurisprudence/DecisionCard';
import FiltersBar, { JurisFilters } from '@/components/jurisprudence/FiltersBar';
import type { Decision, DecisionsPage } from '@/lib/jurisprudence';

export default function JurisprudenceList() {
  const [result,  setResult]  = useState<DecisionsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [filters, setFilters] = useState<JurisFilters>({ search: '', chamber: '', year: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams()
    qs.set('page', String(page))
    if (filters.search)  qs.set('search',  filters.search)
    if (filters.chamber) qs.set('chamber', filters.chamber)
    if (filters.year)    qs.set('year',    filters.year)

    try {
      const res  = await fetch(`/api/jurisprudence?${qs}`)
      const data = await res.json()
      setResult(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [page, filters]);

  useEffect(() => { load() }, [load]);

  // Reset to page 1 when filters change
  const handleFilter = (f: JurisFilters) => {
    setPage(1);
    setFilters(f);
  };

  return (
    <div className="space-y-5">
      <FiltersBar onChange={handleFilter} />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-4 border-[#2152cc] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !result?.data.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <BookOpen className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">لا توجد قرارات تطابق البحث</p>
        </div>
      ) : (
        <>
          {/* Count */}
          <p className="text-xs text-slate-500">
            {result.total.toLocaleString('ar-MA')} قرار
            {filters.search && ` لـ "${filters.search}"`}
          </p>

          {/* Cards */}
          <div className="space-y-4">
            {result.data.map(d => (
              <DecisionCard key={d.id} decision={d} />
            ))}
          </div>

          {/* Pagination */}
          {result.last_page > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                {result.current_page} / {result.last_page}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500
                             hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {/* Page numbers (show ±2) */}
                {Array.from({ length: result.last_page }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - page) <= 2)
                  .map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                        ${p === page
                          ? 'bg-[#2152cc] text-white'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {p}
                    </button>
                  ))}
                <button
                  onClick={() => setPage(p => Math.min(result.last_page, p + 1))}
                  disabled={page === result.last_page}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500
                             hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
