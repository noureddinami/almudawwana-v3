'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Send, CheckCircle, ChevronLeft, Phone, MapPin, Loader2 } from 'lucide-react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
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
      <div className="bg-gradient-to-l from-blue-800 to-blue-900 text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-kufi text-2xl font-bold">تواصل معنا</h1>
          </div>
          <p className="text-blue-200 text-sm max-w-lg">
            هل لديك سؤال أو اقتراح أو تريد الإبلاغ عن خطأ؟ نسعد بالتواصل معك
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/" className="hover:text-blue-600">الرئيسية</Link>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800 font-medium">تواصل معنا</span>
          </nav>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* ── Info cards ─────────────────────────────────── */}
          <div className="space-y-4">
            {[
              {
                icon: Mail,
                title: 'البريد الإلكتروني',
                value: '9anoni@gmail.com',
                sub: 'نرد خلال 24 ساعة',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: MapPin,
                title: 'الموقع',
                value: 'المملكة المغربية',
                sub: 'خدمة رقمية متاحة للجميع',
                color: 'bg-teal-50 text-teal-600',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{item.title}</p>
                  <p className="font-semibold text-slate-900 text-sm">{item.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>
                </div>
              );
            })}

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <p className="text-sm font-bold text-blue-800 mb-2">لماذا تتواصل معنا؟</p>
              <ul className="space-y-1.5 text-xs text-blue-700">
                {['الإبلاغ عن خطأ في نص قانوني', 'اقتراح قانون لإضافته', 'طلب شراكة أو تعاون', 'أسئلة عامة'].map((t, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Form ───────────────────────────────────────── */}
          <div className="md:col-span-2">
            {status === 'sent' ? (
              <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-10 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="font-kufi text-xl font-bold text-slate-900 mb-2">تم الإرسال بنجاح!</h2>
                <p className="text-slate-500 text-sm mb-6">
                  شكراً للتواصل معنا. سنرد على رسالتك في أقرب وقت ممكن.
                </p>
                <button
                  onClick={() => { setStatus('idle'); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  إرسال رسالة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={submit}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <h2 className="font-kufi text-lg font-bold text-slate-900">أرسل لنا رسالة</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      الاسم الكامل <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" required value={form.name} onChange={set('name')}
                      placeholder="محمد الأمين"
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      البريد الإلكتروني <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email" required value={form.email} onChange={set('email')}
                      placeholder="exemple@mail.com"
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    موضوع الرسالة
                  </label>
                  <input
                    type="text" value={form.subject} onChange={set('subject')}
                    placeholder="اقتراح / خطأ / سؤال..."
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    الرسالة <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required rows={6} value={form.message} onChange={set('message')}
                    placeholder="اكتب رسالتك هنا..."
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl resize-none
                               focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 leading-relaxed"
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
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700
                             disabled:opacity-60 text-white py-3 rounded-xl font-medium text-sm
                             transition-colors shadow-sm"
                >
                  {status === 'sending' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />جاري الإرسال...</>
                  ) : (
                    <><Send className="w-4 h-4" />إرسال الرسالة</>
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
