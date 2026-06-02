'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Search, X, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';
import { caseTypeColor, resultColor } from '@/lib/jurisprudence-types';
import type { Decision, DecisionsPage } from '@/lib/jurisprudence-types';

// ── Decision card ─────────────────────────────────────────────────────────────

function DecisionCard({ d, highlight }: { d: Decision; highlight: string }) {
  const tc = caseTypeColor(d.case_type)
  const rc = resultColor(d.result)

  const formattedDate = d.decision_date
    ? new Date(d.decision_date).toLocaleDateString('ar-MA', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  // Simple highlight of the search term in subject
  function mark(text: string | null) {
    if (!text || !highlight || highlight.length < 5) return text ?? ''
    const re = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(re, '<mark class="bg-yellow-200 rounded-sm px-0.5">$1</mark>')
  }

  const shortSubject = (d.subject ?? '').slice(0, 240)

  return (
    <Link href={`/jurisprudence/${d.id}`}>
      <div className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300
                      hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group">
        <div className={`h-1 ${tc.bar}`} />
        <div className="p-5">

          {/* Badges + date */}
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
            </div>
            {formattedDate && (
              <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                <Calendar className="w-3 h-3" />{formattedDate}
              </span>
            )}
          </div>

          {/* Numbers */}
          <div className="flex items-center gap-3 mb-2 text-xs text-slate-500 font-mono">
            <span>{d.file_number}</span>
            <span className="text-slate-200">·</span>
            <span className="text-[#2152cc] font-medium">{d.case_number}</span>
          </div>

          {/* Subject */}
          {d.subject && (
            <p
              className="text-sm text-slate-700 leading-relaxed font-amiri line-clamp-3"
              dangerouslySetInnerHTML={{
                __html: mark(shortSubject) + (d.subject.length > 240 ? '…' : ''),
              }}
            />
          )}

          {/* PDF + read more */}
          <div className="mt-3 flex items-center justify-between text-xs">
            {d.pdf_url ? (
              <span className="flex items-center gap-1 text-slate-400">
                <FileText className="w-3 h-3" /> PDF متاح
              </span>
            ) : <span />}
            <span className="text-blue-600 group-hover:text-blue-700 font-medium flex items-center gap-1">
              عرض القرار <ChevronLeft className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Main list ─────────────────────────────────────────────────────────────────

export default function JurisprudenceList() {
  const [result,   setResult]   = useState<DecisionsPage | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)

  // Filters
  const [subject,  setSubject]  = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [caseType, setCaseType] = useState('')
  const [resultVal,setResultVal]= useState('')

  // Subject validation
  const subjectOk = subject === '' || subject.length >= 5

  // Dropdown options from API
  const [types,   setTypes]   = useState<string[]>([])
  const [results, setResults] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/jurisprudence/filters')
      .then(r => r.json())
      .then(d => { setTypes(d.types ?? []); setResults(d.results ?? []) })
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    // Don't search if subject is too short
    if (subject.length > 0 && subject.length < 5) return
    setLoading(true)
    const qs = new URLSearchParams({ page: String(page) })
    if (subject)   qs.set('subject',   subject)
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
  }, [page, subject, dateFrom, dateTo, caseType, resultVal])

  useEffect(() => { load() }, [load])

  const reset = () => {
    setSubject(''); setDateFrom(''); setDateTo('')
    setCaseType(''); setResultVal(''); setPage(1)
  }

  const hasFilters = subject || dateFrom || dateTo || caseType || resultVal

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  return (
    <div className="space-y-5">

      {/* ── Search form ─────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit}
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
              onChange={e => { setSubject(e.target.value); setPage(1) }}
              placeholder="ابحث في موضوع القرار... (5 أحرف على الأقل)"
              className={`w-full pr-9 pl-10 py-3 text-sm border rounded-xl
                         focus:outline-none focus:ring-2
                         ${!subjectOk
                           ? 'border-amber-300 focus:ring-amber-400 bg-amber-50'
                           : 'border-slate-200 focus:ring-blue-500'}`}
            />
            {subject && (
              <button type="button" onClick={() => { setSubject(''); setPage(1) }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {!subjectOk && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              يجب إدخال 5 أحرف على الأقل للبحث
            </p>
          )}
        </div>

        {/* Date + type + result — flat row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">من تاريخ</label>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }}
              dir="ltr"
              className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">إلى تاريخ</label>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }}
              dir="ltr"
              className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">نوع القضية</label>
            <select value={caseType} onChange={e => { setCaseType(e.target.value); setPage(1) }}
              className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">الكل</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">النتيجة</label>
            <select value={resultVal} onChange={e => { setResultVal(e.target.value); setPage(1) }}
              className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">الكل</option>
              {results.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between gap-3">
          {hasFilters ? (
            <button type="button" onClick={reset}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
              <X className="w-3 h-3" /> إعادة تعيين
            </button>
          ) : <span />}
          <button type="submit"
            disabled={!subjectOk}
            className="flex items-center gap-2 bg-[#2152cc] text-white text-sm font-medium
                       px-5 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-40
                       disabled:cursor-not-allowed transition-colors">
            <Search className="w-4 h-4" />
            بحث
          </button>
        </div>
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
          <p className="text-xs text-slate-500">
            {result.total.toLocaleString('ar-MA')} قرار
            {subject && ` — "${subject}"`}
          </p>

          <div className="space-y-4">
            {result.data.map(d => (
              <DecisionCard key={d.id} d={d} highlight={subject} />
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
