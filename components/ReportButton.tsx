'use client'

import { useState } from 'react'
import { Flag, X, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const REASONS: { value: string; label: string }[] = [
  { value: 'spelling_error',   label: 'خطأ إملائي أو نحوي' },
  { value: 'outdated',         label: 'مادة منسوخة أو ملغاة غير مُحدَّثة' },
  { value: 'numbering_error',  label: 'خطأ في ترقيم المادة' },
  { value: 'incomplete',       label: 'محتوى منقوص أو ناقص' },
  { value: 'conflict',         label: 'تعارض مع نص قانوني آخر' },
  { value: 'other',            label: 'إشكال آخر' },
]

interface Props {
  articleId: string
  articleNumber: string
}

export default function ReportButton({ articleId, articleNumber }: Props) {
  const [open, setOpen]           = useState(false)
  const [reason, setReason]       = useState('')
  const [description, setDesc]    = useState('')
  const [saving, setSaving]       = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!reason) { toast.error('يرجى تحديد سبب الإبلاغ'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, reason, description }),
      })
      if (!res.ok) throw new Error('فشل الإرسال')
      setSubmitted(true)
      toast.success('تم إرسال البلاغ — شكراً لمساهمتك!')
      setTimeout(() => { setOpen(false); setSubmitted(false); setReason(''); setDesc('') }, 2000)
    } catch {
      toast.error('تعذّر إرسال البلاغ، حاول مرة أخرى')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500
                   transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
        title="إبلاغ عن إشكال في هذه المادة"
      >
        <Flag className="w-3.5 h-3.5" />
        <span>إبلاغ</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-500" />
                <h2 className="font-semibold text-slate-800 text-sm">
                  ابلاغ عن مادة — المادة {articleNumber}
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitted ? (
              <div className="px-5 py-10 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-slate-700 font-medium">تم إرسال البلاغ بنجاح</p>
                <p className="text-slate-500 text-sm mt-1">شكراً على مساهمتك في تحسين المدوّنة</p>
              </div>
            ) : (
              <div className="px-5 py-5 space-y-4">
                {/* Reason selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">
                    نوع الإشكال <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {REASONS.map((r) => (
                      <label
                        key={r.value}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm
                          ${reason === r.value
                            ? 'border-red-300 bg-red-50 text-red-700'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'}
                        `}
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={r.value}
                          checked={reason === r.value}
                          onChange={() => setReason(r.value)}
                          className="accent-red-500"
                        />
                        {r.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Optional description */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    تفاصيل إضافية (اختياري)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="اشرح الإشكال بشكل مفصّل إن أمكن…"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700
                               resize-none focus:outline-none focus:ring-2 focus:ring-red-300 placeholder:text-slate-400"
                  />
                  <p className="text-[10px] text-slate-400 text-left mt-1">{description.length}/500</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleSubmit}
                    disabled={saving || !reason}
                    className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed
                               text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                  >
                    {saving ? 'جارٍ الإرسال…' : 'إرسال البلاغ'}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 rounded-xl
                               border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
