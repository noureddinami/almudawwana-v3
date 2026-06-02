'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Search, X, Calendar, Filter } from 'lucide-react';
import Link from 'next/link';
import { caseTypeColor, resultColor } from '@/lib/jurisprudence-types';
import type { Decision, DecisionsPage } from '@/lib/jurisprudence-types';

// ── DecisionCard ──────────────────────────────────────────────────────────────

function DecisionCard({ decision: d, keywords }: { decision: Decision; keywords: string[] }) {
  const tc = caseTypeColor(d.case_type)
  const rc = resultColor(d.result)

  const formattedDate = d.decision_date
    ? new Date(d.decision_date).toLocaleDateString('ar-MA', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  // Simple keyword highlight
  function highlight(text: string | null) {
    if (!text || !keywords.length) return text ?? ''
    let out = text
    keywords.forEach(kw => {
      const re = new RegExp(`(${kw})`, 'gi')
      out = out.replace(re, '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>')
    })
    return out
  }

  const shortSubject = (d.subject ?? '').slice(0, 220)
  const highlightedSubject = highlight(shortSubject)

  return (
    <Link href={`/jurisprudence/${d.id}`}>
      <div className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300
                      hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group">
        {/* Color bar */}
        <div className={`h-1 ${tc.bar}`} />

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {d.case_type && (
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${tc.bg} ${tc.text} ${tc.border}`}>
                  {d.case_type}
                </span>
              )}
              {d.result && (
                <span className={`text-xs px-2.5 py-1 rounded-full border ${rc.bg} ${rc.text} ${rc.border}`}>
                  {d.result}
                </span>
              )}
            </div>
            {formattedDate && (
              <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1 shrink-0">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-mono text-slate-500">{d.file_number}</span>
            <span className="text-slate-200">·</span>
            <span className="text-xs font-mono font-medium text-[#2152cc]">{d.case_number}</span>
          </div>

          {d.subject && (
            <p
              className="text-sm text-slate-700 leading-relaxed font-amiri line-clamp-3"
              dangerouslySetInnerHTML={{ __html: highlightedSubject + (d.subject.length > 220 ? '…' : '') }}
            />
          )}

          <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 group-hover:text-blue-700 font-medium">
            عرض القرار كاملاً
            <ChevronLeft className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function JurisprudenceList() {
  const [result,   setResult]   = useState<DecisionsPage & { keywords?: string[] } | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)

  // Filters
  const [keywords,  setKeywords]  = useState('')
  const [dateFrom,  setDateFrom]  = useState('')
  const [dateTo,    setDateTo]    = useState('')
  const [caseType,  setCaseType]  = useState('')
  const [resultVal, setResultVal] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Filter options from API
  const [types,   setTypes]   = useState<string[]>([])
  const [results, setResults] = useState<string[]>([])

  // Load filter options once
  useEffect(() => {
    fetch('/api/jurisprudence/filters')
      .then(r => r.json())
      .then(d => { setTypes(d.types ?? []); setResults(d.results ?? []) })
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const qs = new URLSearchParams({ page: String(page) })
    if (keywords)  qs.set('keywords',  keywords)
    if (dateFrom)  qs.set('date_from', dateFrom)
    if (dateTo)    qs.set('date_to',   dateTo)
    if (caseType)  qs.set('case_type', caseType)
    if (resultVal) qs.set('result',    resultVal)

    try {
      const res  = await fetch(`/api/jurisprudence?${qs}`)
      const data = await res.json()
      setResult(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [page, keywords, dateFrom, dateTo, caseType, resultVal])

  useEffect(() => { load() }, [load])

  const resetFilters = () => {
    setKeywords(''); setDateFrom(''); setDateTo('')
    setCaseType(''); setResultVal('')
    setPage(1)
  }

  const hasFilters = keywords || dateFrom || dateTo || caseType || resultVal

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1) }

  return (
    <div className="space-y-5">

      {/* ── Search form ──────────────────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">

        {/* Keywords */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            placeholder="ابحث بمصطلحات قانونية... (نفقة، ملكية، عقد...)"
            className="w-full pr-9 pl-12 py-3 text-sm border border-slate-200 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {keywords && (
            <button type="button" onClick={() => setKeywords('')}
              className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button type="submit"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#2152cc] text-white
                       text-xs px-2.5 py-1.5 rounded-lg hover:bg-blue-700 font-medium">
            بحث
          </button>
        </div>

        {/* Toggle advanced filters */}
        <button type="button" onClick={() => setShowFilters(f => !f)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors">
          <Filter className="w-3.5 h-3.5" />
          {showFilters ? 'إخفاء الفلاتر' : 'فلاتر متقدمة'}
          {hasFilters && !showFilters && (
            <span className="bg-blue-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {[dateFrom, dateTo, caseType, resultVal].filter(Boolean).length}
            </span>
          )}
        </button>

        {/* Advanced filters */}
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-100">
            {/* Date from */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">من تاريخ</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} dir="ltr"
                className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {/* Date to */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">إلى تاريخ</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} dir="ltr"
                className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {/* نوع القضية */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">نوع القضية</label>
              <select value={caseType} onChange={e => setCaseType(e.target.value)}
                className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">الكل</option>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {/* النتيجة */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">النتيجة</label>
              <select value={resultVal} onChange={e => setResultVal(e.target.value)}
                className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">الكل</option>
                {results.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        )}

        {hasFilters && (
          <button type="button" onClick={resetFilters}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
            <X className="w-3 h-3" />
            إعادة تعيين الفلاتر
          </button>
        )}
      </form>

      {/* ── Info note about keyword logic ─────────────────────────────── */}
      {keywords && (
        <p className="text-xs text-slate-400 px-1">
          يتم البحث عن كلمات بـ 5 أحرف أو أكثر بعد استبعاد أدوات الربط، ويُعرض القرار إذا تطابقت 60% منها في الموضوع.
        </p>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-4 border-[#2152cc] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !result?.data.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <BookOpen className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">لا توجد قرارات تطابق البحث</p>
          {hasFilters && (
            <button onClick={resetFilters} className="mt-2 text-xs text-blue-600 hover:underline">
              مسح الفلاتر
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500">
            {result.total.toLocaleString('ar-MA')} قرار
            {keywords && ` — كلمات: "${keywords}"`}
          </p>

          <div className="space-y-4">
            {result.data.map(d => (
              <DecisionCard key={d.id} decision={d} keywords={result.keywords ?? []} />
            ))}
          </div>

          {/* Pagination */}
          {result.last_page > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">{result.current_page} / {result.last_page}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500
                             hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
                {Array.from({ length: result.last_page }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - page) <= 2)
                  .map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                        ${p === page ? 'bg-[#2152cc] text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {p}
                    </button>
                  ))}
                <button onClick={() => setPage(p => Math.min(result.last_page, p + 1))} disabled={page === result.last_page}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500
                             hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
