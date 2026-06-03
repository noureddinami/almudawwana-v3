'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Search, X, Calendar, Shuffle } from 'lucide-react';
import Link from 'next/link';
import { caseTypeColor, resultColor } from '@/lib/jurisprudence-types';
import { extractKeywords } from '@/lib/arabic-search';
import { PdfButtons } from '@/components/PdfButtons';
import type { Decision, DecisionsPage } from '@/lib/jurisprudence-types';

// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  if (pct === 100) return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
      ✓ 100%
    </span>
  )
  if (pct >= 80) return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
      {pct}%+
    </span>
  )
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
      {pct}%
    </span>
  )
}

// ── Decision card ─────────────────────────────────────────────────────────────

function DecisionCard({ d, keywords }: { d: Decision; keywords: string[] }) {
  const tc = caseTypeColor(d.case_type)
  const rc = resultColor(d.result)

  const formattedDate = d.decision_date
    ? new Date(d.decision_date).toLocaleDateString('ar-MA', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  // Highlight matched keywords in subject
  function mark(text: string | null): string {
    if (!text || !keywords.length) return text ?? ''
    let out = text
    keywords.forEach(kw => {
      if (kw.length < 3) return
      const re = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
      out = out.replace(re, '<mark class="bg-yellow-200 rounded-sm px-0.5">$1</mark>')
    })
    return out
  }

  const shortSubject = (d.subject ?? '').slice(0, 260)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300
                    hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className={`h-1 ${tc.bar}`} />
      <div className="p-5">

        {/* Row 1: badges + score + date */}
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
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
            {d.score !== undefined && <ScoreBadge score={d.score} />}
          </div>
          {formattedDate && (
            <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
              <Calendar className="w-3 h-3" />{formattedDate}
            </span>
          )}
        </div>

        {/* Row 2: file + case numbers */}
        <div className="flex items-center gap-3 mb-2 text-xs text-slate-500 font-mono">
          <span>{d.file_number}</span>
          <span className="text-slate-200">·</span>
          <span className="text-[#2152cc] font-medium">{d.case_number}</span>
        </div>

        {/* Row 3: subject (clickable) */}
        <Link href={`/jurisprudence/${d.id}`} className="group block">
          {d.subject && (
            <p
              className="text-sm text-slate-700 leading-relaxed font-amiri line-clamp-3
                         group-hover:text-slate-900 transition-colors"
              dangerouslySetInnerHTML={{
                __html: mark(shortSubject) + (d.subject.length > 260 ? '…' : ''),
              }}
            />
          )}
          <span className="text-[11px] text-[#2152cc] group-hover:underline mt-1 inline-block">
            عرض القرار ←
          </span>
        </Link>

        {/* Row 4: PDF buttons */}
        {d.pdf_url && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <PdfButtons url={d.pdf_url} title={`قرار ${d.case_number} — ملف ${d.file_number}`} size="sm" />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Response type (extended) ──────────────────────────────────────────────────

type JurisResponse = DecisionsPage & {
  keywords?: string[]
  mode?:     string
}

// ── Main list ─────────────────────────────────────────────────────────────────

export default function JurisprudenceList() {
  const [result,   setResult]   = useState<JurisResponse | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)

  // Filters
  const [subject,   setSubject]   = useState('')
  const [dateFrom,  setDateFrom]  = useState('')
  const [dateTo,    setDateTo]    = useState('')
  const [caseType,  setCaseType]  = useState('')
  const [resultVal, setResultVal] = useState('')

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Live keyword chips (shown while typing)
  const liveKeywords = extractKeywords(subject)

  // Dropdown options
  const [types,   setTypes]   = useState<string[]>([])
  const [results, setResults] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/jurisprudence/filters')
      .then(r => r.json())
      .then(d => { setTypes(d.types ?? []); setResults(d.results ?? []) })
      .catch(() => {})
  }, [])

  // ── Load function ─────────────────────────────────────────────────────────

  const load = useCallback(async (
    subj: string, dFrom: string, dTo: string, ct: string, rv: string, pg: number
  ) => {
    setLoading(true)
    const qs = new URLSearchParams({ page: String(pg) })
    if (subj)  qs.set('subject',   subj)
    if (dFrom) qs.set('date_from', dFrom)
    if (dTo)   qs.set('date_to',   dTo)
    if (ct)    qs.set('case_type', ct)
    if (rv)    qs.set('result',    rv)
    try {
      const res  = await fetch(`/api/jurisprudence?${qs}`)
      const data = await res.json()
      setResult(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  // ── Debounced search on subject change ────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      load(subject, dateFrom, dateTo, caseType, resultVal, 1)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject])

  // Immediate load on filter/page changes (not subject)
  useEffect(() => {
    load(subject, dateFrom, dateTo, caseType, resultVal, page)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, caseType, resultVal, page])

  const reset = () => {
    setSubject(''); setDateFrom(''); setDateTo('')
    setCaseType(''); setResultVal(''); setPage(1)
  }

  const hasFilters    = subject || dateFrom || dateTo || caseType || resultVal
  const isRandom      = result?.mode === 'random' || result?.mode === 'latest'
  const activeKeywords = result?.keywords ?? []

  return (
    <div className="space-y-5">

      {/* ── Search form ─────────────────────────────────────────────── */}
      <form onSubmit={e => e.preventDefault()}
        className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">

        {/* Subject search */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            الموضوع / القاعدة القانونية
          </label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="أدخل موضوع القضية... مثال: الفصل التعسفي، تعويض، عقد الإيجار"
              className="w-full pr-9 pl-9 py-3 text-sm border border-slate-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-[#2152cc]"
            />
            {subject && (
              <button type="button" onClick={() => setSubject('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Live keyword chips */}
          {liveKeywords.length >= 2 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[11px] text-slate-400">كلمات البحث:</span>
              {liveKeywords.map(k => (
                <span key={k}
                  className="bg-blue-50 text-blue-700 text-[11px] px-2 py-0.5
                             rounded-full border border-blue-100">
                  {k}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Date + type + result */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">من تاريخ</label>
            <input type="date" value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1) }}
              dir="ltr"
              className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-[#2152cc]" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">إلى تاريخ</label>
            <input type="date" value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1) }}
              dir="ltr"
              className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-[#2152cc]" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">نوع القضية</label>
            <select value={caseType} onChange={e => { setCaseType(e.target.value); setPage(1) }}
              className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-[#2152cc] bg-white">
              <option value="">الكل</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">النتيجة</label>
            <select value={resultVal} onChange={e => { setResultVal(e.target.value); setPage(1) }}
              className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-[#2152cc] bg-white">
              <option value="">الكل</option>
              {results.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* Reset */}
        {hasFilters && (
          <button type="button" onClick={reset}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
            <X className="w-3 h-3" /> إعادة تعيين الفلاتر
          </button>
        )}
      </form>

      {/* ── Results ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-4 border-[#2152cc] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !result?.data.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <BookOpen className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">لا توجد قرارات تطابق البحث</p>
          {hasFilters && (
            <button onClick={reset} className="mt-2 text-xs text-blue-600 hover:underline">
              مسح الفلاتر
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Count + mode hint */}
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-500">
              {result.total.toLocaleString('ar-MA')} قرار
              {activeKeywords.length > 0 && (
                <span className="text-[#2152cc] mr-1">
                  — بحث عن: {activeKeywords.slice(0, 5).join(' · ')}
                </span>
              )}
            </p>
            {isRandom && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400
                               bg-slate-100 px-2 py-0.5 rounded-full">
                <Shuffle className="w-3 h-3" /> عرض عشوائي
              </span>
            )}
          </div>

          <div className="space-y-4">
            {result.data.map(d => (
              <DecisionCard key={d.id} d={d} keywords={activeKeywords} />
            ))}
          </div>

          {/* Pagination (not shown for random) */}
          {!isRandom && result.last_page > 1 && (
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
                        ${p === page
                          ? 'bg-[#2152cc] text-white'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {p}
                    </button>
                  ))}
                <button onClick={() => setPage(p => Math.min(result.last_page, p + 1))}
                  disabled={page === result.last_page}
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
