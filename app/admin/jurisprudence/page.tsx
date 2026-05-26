'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Scale, Upload, Plus, Pencil, Trash2, Search, RefreshCw,
  X, ChevronLeft, ChevronRight, FileText, CheckCircle,
  AlertCircle, ChevronsUpDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { CHAMBER_LABELS } from '@/lib/jurisprudence-types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Decision {
  id:              string
  case_number:     string
  chamber:         string | null
  chamber_slug:    string | null
  decision_nature: string | null
  subject_short:   string | null
  decision_date:   string | null
  pdf_url:         string | null
  import_batch:    string | null
  created_at:      string
}

type FormState = {
  case_number:     string
  chamber:         string
  chamber_slug:    string
  decision_nature: string
  subject:         string
  decision_date:   string
  pdf_url:         string
}

const CHAMBERS = [
  { slug: 'civil',          ar: 'الغرفة المدنية'        },
  { slug: 'criminal',       ar: 'الغرفة الجنائية'       },
  { slug: 'social',         ar: 'الغرفة الاجتماعية'     },
  { slug: 'commercial',     ar: 'الغرفة التجارية'       },
  { slug: 'administrative', ar: 'الغرفة الإدارية'       },
  { slug: 'other',          ar: 'غير محدد'              },
]

const emptyForm: FormState = {
  case_number: '', chamber: '', chamber_slug: 'other',
  decision_nature: '', subject: '', decision_date: '', pdf_url: '',
}

// ── ImportModal ───────────────────────────────────────────────────────────────

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const fileRef    = useRef<HTMLInputElement>(null)
  const [file,     setFile]     = useState<File | null>(null)
  const [batch,    setBatch]    = useState(new Date().toISOString().slice(0, 10))
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<any>(null)

  const submit = async () => {
    if (!file) return toast.error('اختر ملف CSV')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file',  file)
      fd.append('batch', batch)

      const res  = await fetch('/api/admin/jurisprudence/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'خطأ')
      setResult(data)
      onDone()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            استيراد CSV
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {!result ? (
            <>
              {/* File picker */}
              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center
                           cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                {file
                  ? <p className="text-sm font-medium text-blue-700">{file.name}</p>
                  : <p className="text-sm text-slate-500">انقر لاختيار ملف .csv</p>
                }
                <p className="text-xs text-slate-400 mt-1">
                  الأعمدة المطلوبة: case_number, chamber, subject, pdf_url
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
              </div>

              {/* Batch tag */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  تاريخ الدفعة <span className="text-slate-400 font-normal text-xs">(للتتبع)</span>
                </label>
                <input
                  type="date"
                  value={batch}
                  onChange={e => setBatch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
              </div>

              <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
                سيتم استخدام <code>upsert</code> على <code>case_number</code> — لن تُكرَّر القرارات الموجودة.
                يتم استخراج تاغات المواد تلقائياً بـ Regex.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                  إلغاء
                </button>
                <button
                  onClick={submit}
                  disabled={loading || !file}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg
                             hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />جاري الاستيراد...</>
                    : <><Upload className="w-4 h-4" />استيراد</>
                  }
                </button>
              </div>
            </>
          ) : (
            /* Result report */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-bold">اكتمل الاستيراد</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'إجمالي الصفوف',  value: result.total    },
                  { label: 'مُضاف / مُحدَّث', value: result.inserted  },
                  { label: 'أخطاء',           value: result.errors   },
                  { label: 'تاغات المواد',    value: result.tags     },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-slate-900">{s.value ?? 0}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              {result.errors > 0 && (
                <div className="flex items-start gap-2 text-amber-700 bg-amber-50 rounded-xl p-3 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>بعض الصفوف لم تُستورَد (case_number فارغ أو مكرر بنفس القيم)</span>
                </div>
              )}
              <button
                onClick={onClose}
                className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                إغلاق
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── EditModal ─────────────────────────────────────────────────────────────────

function EditModal({
  mode, initial, onClose, onSave,
}: {
  mode:    'create' | 'edit'
  initial: FormState
  onClose: () => void
  onSave:  (data: FormState) => Promise<void>
}) {
  const [form,   setForm]   = useState<FormState>(initial)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.case_number.trim()) return toast.error('رقم الملف مطلوب')
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">
            {mode === 'create' ? 'إضافة قرار' : 'تعديل القرار'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">رقم الملف *</label>
              <input
                required dir="ltr"
                value={form.case_number}
                onChange={e => setForm(f => ({ ...f, case_number: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الغرفة</label>
              <select
                value={form.chamber_slug}
                onChange={e => {
                  const s = CHAMBERS.find(c => c.slug === e.target.value)
                  setForm(f => ({ ...f, chamber_slug: e.target.value, chamber: s?.ar ?? '' }))
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CHAMBERS.map(c => (
                  <option key={c.slug} value={c.slug}>{c.ar}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">طبيعة القرار</label>
              <input
                value={form.decision_nature}
                onChange={e => setForm(f => ({ ...f, decision_nature: e.target.value }))}
                placeholder="نقض / رفض / إحالة..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ القرار</label>
              <input
                type="date" dir="ltr"
                value={form.decision_date}
                onChange={e => setForm(f => ({ ...f, decision_date: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">موضوع القرار</label>
            <textarea
              rows={4}
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="اكتب موضوع القرار..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">رابط PDF</label>
            <input
              type="url" dir="ltr"
              value={form.pdf_url}
              onChange={e => setForm(f => ({ ...f, pdf_url: e.target.value }))}
              placeholder="https://pub-....r2.dev/..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600">إلغاء</button>
            <button
              type="submit" disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg
                         hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : mode === 'create' ? 'إضافة' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminJurisprudencePage() {
  const [data,         setData]         = useState<any | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [q,            setQ]            = useState('')
  const [chamber,      setChamber]      = useState('')
  const [page,         setPage]         = useState(1)
  const [showImport,   setShowImport]   = useState(false)
  const [modal,        setModal]        = useState<'create' | 'edit' | null>(null)
  const [editing,      setEditing]      = useState<Decision | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Decision | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const qs = new URLSearchParams()
    qs.set('page', String(page))
    if (q)       qs.set('q', q)
    if (chamber) qs.set('chamber', chamber)

    fetch(`/api/admin/jurisprudence?${qs}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('mudawwana_token') ?? ''}`,
      },
    })
      .then(r => r.json())
      .then(setData)
      .catch(() => toast.error('فشل التحميل'))
      .finally(() => setLoading(false))
  }, [page, q, chamber])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setModal('create') }
  const openEdit   = (d: Decision) => { setEditing(d); setModal('edit') }

  const handleSave = async (form: FormState) => {
    const token = localStorage.getItem('mudawwana_token') ?? ''
    const headers = {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
    }
    const payload = {
      case_number:     form.case_number.trim(),
      chamber:         form.chamber     || null,
      chamber_slug:    form.chamber_slug || 'other',
      decision_nature: form.decision_nature || null,
      subject:         form.subject || null,
      decision_date:   form.decision_date || null,
      pdf_url:         form.pdf_url || null,
    }

    if (modal === 'create') {
      const res  = await fetch('/api/admin/jurisprudence', { method: 'POST', headers, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success('تمت الإضافة')
    } else if (editing) {
      const res  = await fetch(`/api/admin/jurisprudence/${editing.id}`, { method: 'PUT', headers, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success('تم التحديث')
    }
    setModal(null)
    load()
  }

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) return
    const res = await fetch(`/api/admin/jurisprudence/${deleteTarget.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('mudawwana_token') ?? ''}` },
    })
    const d = await res.json()
    if (!res.ok) { toast.error(d.message); return }
    toast.success('تم الحذف')
    setDeleteTarget(null)
    load()
  }

  const editForm = editing ? {
    case_number:     editing.case_number,
    chamber:         CHAMBER_LABELS[editing.chamber_slug ?? ''] ?? '',
    chamber_slug:    editing.chamber_slug ?? 'other',
    decision_nature: editing.decision_nature ?? '',
    subject:         '',   // not fetched in list
    decision_date:   editing.decision_date?.slice(0, 10) ?? '',
    pdf_url:         editing.pdf_url ?? '',
  } : emptyForm

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-[#2152cc]" />
          <h1 className="text-2xl font-bold text-slate-900 font-kufi">الاجتهاد القضائي</h1>
          {data && (
            <span className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {data.total?.toLocaleString('ar-MA') ?? 0} قرار
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2
                       rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            <Upload className="w-4 h-4" />
            استيراد CSV
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2
                       rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            إضافة قرار
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1) }}
            placeholder="بحث برقم الملف أو الموضوع..."
            className="w-full pr-9 pl-3 py-2 text-sm border border-slate-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={chamber}
          onChange={e => { setChamber(e.target.value); setPage(1) }}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">كل الغرف</option>
          {CHAMBERS.map(c => (
            <option key={c.slug} value={c.slug}>{c.ar}</option>
          ))}
        </select>
        <button onClick={load} className="text-slate-400 hover:text-blue-600">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-4 border-[#2152cc] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data?.data?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Scale className="w-10 h-10 opacity-30" />
            <p className="text-sm">لا توجد قرارات{q ? ` لـ "${q}"` : ''}</p>
            {!data?.data && (
              <p className="text-xs text-slate-300">قم بإنشاء الجداول في Supabase أولاً</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">رقم الملف</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">الغرفة</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">الموضوع</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">التاريخ</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">PDF</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.data as Decision[]).map(d => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-slate-900 whitespace-nowrap">
                      {d.case_number}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-slate-600">
                        {CHAMBER_LABELS[d.chamber_slug ?? ''] ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs text-slate-600 line-clamp-2 font-amiri">
                        {d.subject_short ?? '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-500 whitespace-nowrap" dir="ltr">
                      {d.decision_date
                        ? new Date(d.decision_date).toLocaleDateString('fr-MA')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {d.pdf_url
                        ? <a href={d.pdf_url} target="_blank" rel="noopener noreferrer"
                             className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                            <FileText className="w-3.5 h-3.5" />PDF
                          </a>
                        : <span className="text-xs text-slate-300">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(d)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />تعديل
                        </button>
                        <button
                          onClick={() => setDeleteTarget(d)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500">{data.from}–{data.to} من {data.total}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-600">{page} / {data.last_page}</span>
              <button onClick={() => setPage(p => Math.min(data.last_page, p + 1))} disabled={page === data.last_page}
                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); load() }} />
      )}
      {modal && (
        <EditModal
          mode={modal}
          initial={modal === 'edit' && editing ? editForm : emptyForm}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          title={`حذف قرار ${deleteTarget.case_number}`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
