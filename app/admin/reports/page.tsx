'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Flag, CheckCircle2, XCircle, Clock, ExternalLink, Search, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

type Report = {
  id: string
  reason: string
  description: string | null
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  created_at: string
  article: {
    id: string
    number: string
    slug: string
    code: {
      slug: string
      title_ar: string
    } | null
  } | null
}

const REASON_LABELS: Record<string, string> = {
  spelling_error:   'خطأ إملائي أو نحوي',
  outdated:         'مادة منسوخة غير مُحدَّثة',
  numbering_error:  'خطأ في الترقيم',
  incomplete:       'محتوى منقوص',
  conflict:         'تعارض مع نص آخر',
  other:            'إشكال آخر',
}

const STATUS_CONFIG = {
  pending:   { label: 'قيد المراجعة', cls: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Clock },
  reviewed:  { label: 'تمت المراجعة', cls: 'bg-blue-50 text-blue-700 border-blue-200',      icon: CheckCircle2 },
  resolved:  { label: 'تم الحل',      cls: 'bg-green-50 text-green-700 border-green-200',   icon: CheckCircle2 },
  dismissed: { label: 'مرفوض',        cls: 'bg-slate-100 text-slate-500 border-slate-200',  icon: XCircle },
}

export default function AdminReportsPage() {
  const [reports, setReports]   = useState<Report[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<string>('pending')
  const [updating, setUpdating] = useState<string | null>(null)

  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('article_reports')
        .select(`
          id, reason, description, status, created_at,
          article:articles(
            id, number, slug,
            code:codes(slug, title_ar)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (filter !== 'all') query = query.eq('status', filter)

      const { data, error } = await query
      if (error) throw error
      setReports((data ?? []) as unknown as Report[])
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    try {
      const { error } = await supabase
        .from('article_reports')
        .update({ status })
        .eq('id', id)
      if (error) throw error
      toast.success('تم تحديث حالة البلاغ')
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setUpdating(null)
    }
  }

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60)  return `منذ ${m} د`
    if (m < 1440) return `منذ ${Math.floor(m/60)} س`
    return `منذ ${Math.floor(m/1440)} ي`
  }

  const FILTERS = [
    { value: 'all',      label: 'الكل' },
    { value: 'pending',  label: 'قيد المراجعة' },
    { value: 'reviewed', label: 'تمت المراجعة' },
    { value: 'resolved', label: 'تم الحل' },
    { value: 'dismissed',label: 'مرفوض' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Flag className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">بلاغات المواد</h1>
            <p className="text-sm text-slate-500">ابلاغات المستخدمين عن إشكاليات في المواد القانونية</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200
                     rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              filter === f.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Flag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>لا توجد بلاغات</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((r) => {
              const st = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending
              const StatusIcon = st.icon
              const article = r.article
              const code = (r.article as any)?.code ?? null

              return (
                <div key={r.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-wrap items-start gap-3">
                    {/* Status badge */}
                    <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1
                                      rounded-full border ${st.cls}`}>
                      <StatusIcon className="w-3 h-3" />
                      {st.label}
                    </span>

                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Article link */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">
                          {REASON_LABELS[r.reason] ?? r.reason}
                        </span>
                        {article && code && (
                          <Link
                            href={`/codes/${code.slug}/المادة-${article.number}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            المادة {article.number} — {code.title_ar}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                        <span className="text-[11px] text-slate-400 mr-auto">{timeAgo(r.created_at)}</span>
                      </div>

                      {/* Description */}
                      {r.description && (
                        <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                          {r.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {r.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => updateStatus(r.id, 'resolved')}
                          disabled={updating === r.id}
                          className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700
                                     hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          تم الحل
                        </button>
                        <button
                          onClick={() => updateStatus(r.id, 'reviewed')}
                          disabled={updating === r.id}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700
                                     hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          قيد المعالجة
                        </button>
                        <button
                          onClick={() => updateStatus(r.id, 'dismissed')}
                          disabled={updating === r.id}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600
                                     hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          رفض
                        </button>
                      </div>
                    )}
                    {r.status !== 'pending' && (
                      <button
                        onClick={() => updateStatus(r.id, 'pending')}
                        disabled={updating === r.id}
                        className="shrink-0 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700
                                   border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        إعادة فتح
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
