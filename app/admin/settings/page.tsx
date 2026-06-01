'use client';

import { useEffect, useState } from 'react';
import { Settings, Eye, EyeOff, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Liste complète des liens (doit rester synchrone avec Navbar.tsx) ──────────
const ALL_NAV_LINKS = [
  { href: '/',              label: 'الرئيسية',              note: 'الصفحة الرئيسية' },
  { href: '/why',           label: 'حول المدوّنة',            note: 'صفحة التعريف بالمشروع' },
  { href: '/codes',          label: 'النصوص القانونية',      note: 'قائمة القوانين والمدونات' },
  { href: '/jurisprudence', label: 'الاجتهاد القضائي',      note: 'قرارات محكمة النقض' },
  { href: '/#latest',       label: 'آخر الإضافات',          note: 'قسم آخر الإضافات (الصفحة الرئيسية)' },
  { href: '/search',        label: 'البحث',                 note: 'صفحة البحث النصي' },
  { href: '/request-code',  label: 'طلب إضافة نص قانوني',   note: 'نموذج طلب إضافة قانون' },
  { href: '/contact',       label: 'تواصل معنا',            note: 'صفحة التواصل' },
];

export default function AdminSettingsPage() {
  const [hidden,  setHidden]  = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [dirty,   setDirty]   = useState(false);

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('mudawwana_token') ?? '' : ''
  const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` })

  const load = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/settings/nav', { headers: authHeaders() })
      const data = await res.json()
      setHidden(data.hidden ?? [])
      setDirty(false)
    } catch {
      toast.error('فشل تحميل الإعدادات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (href: string) => {
    setHidden(prev =>
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    )
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res  = await fetch('/api/admin/settings/nav', {
        method:  'PUT',
        headers: authHeaders(),
        body:    JSON.stringify({ hidden }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'خطأ')
      toast.success('تم حفظ الإعدادات')
      setDirty(false)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const visibleCount = ALL_NAV_LINKS.length - hidden.length

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-600" />
          <h1 className="text-2xl font-bold text-slate-900 font-kufi">إعدادات الموقع</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="text-slate-400 hover:text-blue-600 p-1" title="تحديث">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2
                       rounded-lg text-sm font-medium hover:bg-blue-700
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>

      {/* Nav links section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 text-base">قائمة التنقل — الواجهة</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              تحكم في ظهور روابط القائمة الرئيسية للزوار
            </p>
          </div>
          <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
            {visibleCount} / {ALL_NAV_LINKS.length} ظاهر
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {ALL_NAV_LINKS.map(link => {
              const isHidden = hidden.includes(link.href)
              return (
                <li key={link.href}
                  className={`flex items-center justify-between px-5 py-4 transition-colors
                    ${isHidden ? 'bg-slate-50/70 opacity-60' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Status dot */}
                    <span className={`w-2 h-2 rounded-full shrink-0
                      ${isHidden ? 'bg-slate-300' : 'bg-emerald-500'}`}
                    />
                    <div>
                      <p className={`font-medium text-sm ${isHidden ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {link.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">{link.href}</p>
                      <p className="text-xs text-slate-400">{link.note}</p>
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggle(link.href)}
                    className={`
                      relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                      transition-colors duration-200 focus:outline-none
                      ${isHidden ? 'bg-slate-200' : 'bg-blue-600'}
                    `}
                    title={isHidden ? 'إظهار' : 'إخفاء'}
                    role="switch"
                    aria-checked={!isHidden}
                  >
                    <span className={`
                      pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg
                      transform transition duration-200
                      ${isHidden ? 'translate-x-0' : 'translate-x-5'}
                    `} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {/* Footer hint */}
        {dirty && (
          <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 text-xs text-amber-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            تغييرات غير محفوظة — اضغط "حفظ التغييرات" لتطبيقها على الموقع
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 space-y-1">
        <p className="font-bold">ملاحظات :</p>
        <ul className="list-disc list-inside space-y-0.5 text-xs text-blue-700">
          <li>التغييرات تُطبَّق فورياً على الواجهة دون إعادة نشر</li>
          <li>الروابط المخفية لا تزال قابلة للوصول عبر الرابط المباشر</li>
          <li>التغييرات مرئية لكل الزوار بعد تحديث الصفحة</li>
        </ul>
      </div>
    </div>
  )
}
