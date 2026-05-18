'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  FilePlus2, Send, CheckCircle, ChevronLeft, Loader2,
  BookOpen, Link2, FileText, User, Mail,
} from 'lucide-react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function RequestCodePage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    codeTitle: '',
    codeLink: '',
    notes: '',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/code-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          codeTitle: form.codeTitle,
          codeLink: form.codeLink,
          notes: form.notes,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(d.error ?? 'حدث خطأ');
      }
      setStatus('sent');
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-l from-emerald-700 to-emerald-900 text-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <FilePlus2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-kufi text-2xl font-bold">طلب إضافة نص قانوني</h1>
          </div>
          <p className="text-emerald-200 text-sm max-w-lg">
            ساهم في إثراء المدوّنة! اقترح نصاً قانونياً لإضافته إلى الموسوعة
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/" className="hover:text-blue-600">الرئيسية</Link>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800 font-medium">طلب إضافة نص قانوني</span>
          </nav>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-10 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* ── Side info ──────────────────────────────── */}
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
              <p className="text-sm font-bold text-emerald-800 mb-3">كيف يتم ذلك؟</p>
              <ol className="space-y-3 text-xs text-emerald-700">
                {[
                  { step: '١', text: 'أرسل لنا اسم النص القانوني ورابطه الرسمي' },
                  { step: '٢', text: 'يراجع فريقنا الطلب ويتحقق من المصدر' },
                  { step: '٣', text: 'يُضاف النص إلى الموسوعة خلال أيام' },
                ].map((item) => (
                  <li key={item.step} className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {item.step}
                    </span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs text-slate-500 mb-2">مصادر مقترحة</p>
              <ul className="space-y-2 text-xs text-slate-600">
                {[
                  { name: 'الأمانة العامة للحكومة', url: 'sgg.gov.ma' },
                  { name: 'الجريدة الرسمية', url: 'bo.gov.ma' },
                  { name: 'Adala Justice', url: 'adala.justice.gov.ma' },
                ].map((s) => (
                  <li key={s.url} className="flex items-center gap-2">
                    <Link2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{s.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Form ──────────────────────────────────── */}
          <div className="md:col-span-2">
            {status === 'sent' ? (
              <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-10 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="font-kufi text-xl font-bold text-slate-900 mb-2">
                  تم إرسال طلبك بنجاح!
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                  شكراً لمساهمتك. سنراجع طلبك ونعمل على إضافة النص في أقرب وقت.
                </p>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setForm({ name: '', email: '', codeTitle: '', codeLink: '', notes: '' });
                  }}
                  className="text-sm text-emerald-600 hover:underline"
                >
                  إرسال طلب آخر
                </button>
              </div>
            ) : (
              <form
                onSubmit={submit}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5"
              >
                <h2 className="font-kufi text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  معلومات النص القانوني
                </h2>

                {/* Code title */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    عنوان النص القانوني <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.codeTitle}
                    onChange={set('codeTitle')}
                    placeholder="مثال: مدونة الأسرة، قانون الالتزامات والعقود..."
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  />
                </div>

                {/* Code link */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                    <Link2 className="w-3.5 h-3.5 text-slate-400" />
                    رابط النص (اختياري)
                  </label>
                  <input
                    type="url"
                    value={form.codeLink}
                    onChange={set('codeLink')}
                    placeholder="https://..."
                    dir="ltr"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    رابط من موقع رسمي (الأمانة العامة، الجريدة الرسمية...)
                  </p>
                </div>

                {/* Separator */}
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    معلوماتك
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        الاسم <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={set('name')}
                        placeholder="الاسم الكامل"
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl
                                   focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        البريد الإلكتروني <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={set('email')}
                        placeholder="exemple@mail.com"
                        dir="ltr"
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl
                                   focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    ملاحظات إضافية
                  </label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={set('notes')}
                    placeholder="أي تفاصيل إضافية عن النص المطلوب..."
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl resize-none
                               focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 leading-relaxed"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    {error || 'حدث خطأ أثناء الإرسال. يرجى المحاولة مجدداً.'}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700
                             disabled:opacity-60 text-white py-3 rounded-xl font-medium text-sm
                             transition-colors shadow-sm"
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      إرسال الطلب
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
