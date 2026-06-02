'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Scale, Upload, Plus, Pencil, Trash2, Search, RefreshCw,
  X, ChevronLeft, ChevronRight, FileText, CheckCircle, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { caseTypeColor, resultColor } from '@/lib/jurisprudence-types';
import type { Decision } from '@/lib/jurisprudence-types';

// ── Types ─────────────────────────────────────────────────────────────────────

type FormState = {
  case_number:   string
  file_number:   string
  decision_date: string
  case_type:     string
  subject:       string
  result:        string
  pdf_url:       string
}

const emptyForm: FormState = {
  case_number: '', file_number: '', decision_date: '',
  case_type: '', subject: '', result: '', pdf_url: '',
}

const authH = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('mudawwana_token') ?? '' : ''}`,
})

// ── ImportModal ───────────────────────────────────────────────────────────────

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const fileRef   = useRef<HTMLInputElement>(null)
  const [file,    setFile]    = useState<File | null>(null)
  const [batch,   setBatch]   = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<any>(null)

  const submit = async () => {
    if (!file) return toast.error('اختر ملف Excel')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file',  file)
      fd.append('batch', batch)
      const res  = await fetch('/api/admin/jurisprudence/import', { method: 'POST', body: fd,
        headers: { Authorization: `Bearer ${localStorage.getItem('mudawwana_token') ?? ''}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'خطأ في الاستيراد')
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
            استيراد Excel
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {!result ? (
            <>
              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center
                           cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                {file
                  ? <p className="text-sm font-medium text-blue-700">{file.name}</p>
                  : <p className="text-sm text-slate-500">انقر لاختيار ملف .xlsx</p>
                }
                <p className="text-xs text-slate-400 mt-1">
                  أعمدة: رقم القرار · رقم الملف · تاريخ القرار · نوع القضية · الموضوع - القاعدة · النتيجة · الرابط
                </p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                  onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  تاريخ الدفعة <span className="text-slate-400 font-normal text-xs">(للتتبع)</span>
                </label>
                <input type="date" value={batch} onChange={e => setBatch(e.target.value)} dir="ltr"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
                استيراد بـ <code>upsert</code> على <code>رقم الملف</code> — لن تُكرَّر القرارات الموجودة، بل ستُحدَّث.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600">إلغاء</button>
                <button onClick={submit} disabled={loading || !file}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg
                             hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />جاري الاستيراد...</>
                    : <><Upload className="w-4 h-4" />استيراد</>}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-bold">اكتمل الاستيراد</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'صفوف Excel',      value: result.parsed   ?? result.total },
                  { label: 'مُضاف / مُحدَّث', value: result.inserted },
                  { label: 'أخطاء',           value: result.errors   },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl p-3 text-center
                    ${s.label === 'أخطاء' && s.value > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                    <p className={`text-2xl font-bold
                      ${s.label === 'أخطاء' && s.value > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      {s.value ?? 0}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              {result.errors > 0 && (
                <div className="flex items-start gap-2 text-amber-700 bg-amber-50 rounded-xl p-3 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p>{result.errors} صف لم يُستورَد</p>
                    {result.errorMsgs?.[0] && (
                      <p className="mt-1 font-mono text-[10px] text-slate-500 break-all">
                        {result.errorMsgs[0]}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {result.parsed !== result.inserted && result.errors === 0 && (
                <p className="text-xs text-blue-600 bg-blue-50 rounded-lg p-2.5">
                  ملاحظة: الفرق بين العدد المحلَّل ({result.parsed}) والمُضاف ({result.inserted}) يعني أن بعض الصفوف كانت موجودة مسبقاً وتم تحديثها.
                </p>
              )}
              <button onClick={onClose}
                className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
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

function EditModal({ mode, initial, onClose, onSave }: {
  mode:    'create' | 'edit'
  initial: FormState
  onClose: () => void
  onSave:  (data: FormState) => Promise<void>
}) {
  const [form,   setForm]   = useState<FormState>(initial)
  const [saving, setSaving] = useState(false)
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.case_number.trim()) return toast.error('رقم القرار مطلوب')
    if (!form.file_number.trim())  return toast.error('رقم الملف مطلوب')
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
              <label className="block text-sm font-medium text-slate-700 mb-1">رقم القرار *</label>
              <input required dir="ltr" value={form.case_number} onChange={set('case_number')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">رقم الملف *</label>
              <input required dir="ltr" value={form.file_number} onChange={set('file_number')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">نوع القضية</label>
              <input value={form.case_type} onChange={set('case_type')} placeholder="مدني، جنائي..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">النتيجة</label>
              <input value={form.result} onChange={set('result')} placeholder="رفض، نقض، تأييد..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ القرار</label>
            <input type="date" dir="ltr" value={form.decision_date} onChange={set('decision_date')}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الموضوع - القاعدة</label>
            <textarea rows={4} value={form.subject} onChange={set('subject')}
              placeholder="اكتب موضوع القرار والقاعدة القانونية..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none
                         focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">رابط PDF / الرابط</label>
            <input type="url" dir="ltr" value={form.pdf_url} onChange={set('pdf_url')}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600">إلغاء</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
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
  const [page,         setPage]         = useState(1)
  const [showImport,   setShowImport]   = useState(false)
  const [modal,        setModal]        = useState<'create' | 'edit' | null>(null)
  const [editing,      setEditing]      = useState<Decision | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Decision | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const qs = new URLSearchParams({ page: String(page) })
    if (q) qs.set('q', q)
    fetch(`/api/admin/jurisprudence?${qs}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('mudawwana_token') ?? ''}` },
    })
      .then(r => r.json())
      .then(setData)
      .catch(() => toast.error('فشل التحميل'))
      .finally(() => setLoading(false))
  }, [page, q])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setModal('create') }
  const openEdit   = (d: Decision) => { setEditing(d); setModal('edit') }

  const handleSave = async (form: FormState) => {
    const method  = modal === 'create' ? 'POST' : 'PUT'
    const url     = modal === 'create' ? '/api/admin/jurisprudence' : `/api/admin/jurisprudence/${editing?.id}`
    const payload = {
      case_number:   form.case_number.trim(),
      file_number:   form.file_number.trim(),
      decision_date: form.decision_date || null,
      case_type:     form.case_type     || null,
      subject:       form.subject       || null,
      result:        form.result        || null,
      pdf_url:       form.pdf_url       || null,
    }
    const res  = await fetch(url, { method, headers: authH(), body: JSON.stringify(payload) })
    const body = await res.json()
    if (!res.ok) throw new Error(body.message)
    toast.success(modal === 'create' ? 'تمت الإضافة' : 'تم التحديث')
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

  const editForm: FormState = editing ? {
    case_number:   editing.case_number   ?? '',
    file_number:   editing.file_number   ?? '',
    decision_date: editing.decision_date?.slice(0, 10) ?? '',
    case_type:     editing.case_type     ?? '',
    subject:       editing.subject       ?? '',
    result:        editing.result        ?? '',
    pdf_url:       editing.pdf_url       ?? '',
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
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2
                       rounded-lg text-sm font-medium hover:bg-emerald-700">
            <Upload className="w-4 h-4" />
            استيراد Excel
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2
                       rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            إضافة قرار
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
            placeholder="بحث برقم القرار أو الملف أو الموضوع..."
            className="w-full pr-9 pl-3 py-2 text-sm border border-slate-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={load} title="تحديث" className="text-slate-400 hover:text-blue-600">
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
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-right font-medium text-slate-600 whitespace-nowrap">رقم الملف</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600 whitespace-nowrap">رقم القرار</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">نوع القضية</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">النتيجة</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600 whitespace-nowrap">التاريخ</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">PDF</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.data as Decision[]).map(d => {
                  const tc = caseTypeColor(d.case_type)
                  const rc = resultColor(d.result)
                  return (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{d.file_number}</td>
                      <td className="px-4 py-3 font-mono text-sm font-medium text-slate-900 whitespace-nowrap">{d.case_number}</td>
                      <td className="px-4 py-3 text-center">
                        {d.case_type
                          ? <span className={`text-xs px-2 py-0.5 rounded-full border ${tc.bg} ${tc.text} ${tc.border}`}>{d.case_type}</span>
                          : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {d.result
                          ? <span className={`text-xs px-2 py-0.5 rounded-full border ${rc.bg} ${rc.text} ${rc.border}`}>{d.result}</span>
                          : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-500 whitespace-nowrap" dir="ltr">
                        {d.decision_date ? new Date(d.decision_date).toLocaleDateString('fr-MA') : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {d.pdf_url
                          ? <a href={d.pdf_url} target="_blank" rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                              <FileText className="w-3.5 h-3.5" />PDF
                            </a>
                          : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(d)}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <Pencil className="w-3 h-3" />تعديل
                          </button>
                          <button onClick={() => setDeleteTarget(d)}
                            className="text-xs text-red-500 hover:text-red-700">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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
        <EditModal mode={modal} initial={editForm} onClose={() => setModal(null)} onSave={handleSave} />
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
