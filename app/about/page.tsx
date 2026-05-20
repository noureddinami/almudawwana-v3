import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ShareButton from '@/components/ShareButton';
import {
  Scale, BookOpen, Search, Shield, Smartphone, Zap,
  Globe, Download, ChevronLeft, Share2, Monitor,
  MoreVertical, PlusSquare, ArrowUpFromLine
} from 'lucide-react';

const BASE_URL = 'https://modawana.app';

export const metadata: Metadata = {
  title: 'حول المدوّنة',
  description: 'تعرّف على منصة المدوّنة — الموسوعة القانونية المغربية. اكتشف مميزاتها، طريقة تثبيتها على هاتفك، والمزيد.',
  openGraph: {
    title: 'حول المدوّنة — الموسوعة القانونية المغربية',
    description: 'تعرّف على المنصة وطريقة تثبيتها على هاتفك',
    url: `${BASE_URL}/about`,
    type: 'website',
    locale: 'ar_MA',
    siteName: 'المدوّنة — Al-Mudawwana',
    images: [{ url: `${BASE_URL}/icon-512x512.png`, width: 512, height: 512 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'حول المدوّنة — الموسوعة القانونية المغربية',
    description: 'تعرّف على المنصة وطريقة تثبيتها على هاتفك',
  },
  alternates: { canonical: `${BASE_URL}/about` },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-blue-900 via-blue-800 to-indigo-900 text-white">
        {/* Decorative circles */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/20" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-400/20" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20
                          rounded-full px-4 py-1.5 text-sm mb-6">
            <Scale className="w-4 h-4" />
            منصة قانونية مغربية مجانية
          </div>

          <h1 className="font-kufi text-3xl sm:text-5xl font-bold leading-tight mb-4">
            المدوّنة
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed mb-2">
            الموسوعة القانونية المغربية الشاملة
          </p>
          <p className="text-blue-200 max-w-xl mx-auto mb-8">
            تصفّح جميع القوانين والمدونات المغربية مجاناً — من الدستور إلى المراسيم التنظيمية
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/codes"
              className="inline-flex items-center gap-2 bg-white text-blue-900 font-semibold
                         px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
              <BookOpen className="w-5 h-5" />
              تصفّح النصوص القانونية
            </Link>
            <Link href="/search"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30
                         text-white font-medium px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">
              <Search className="w-5 h-5" />
              ابحث في القوانين
            </Link>
          </div>
        </div>
      </section>

      {/* ── What is Al-Mudawwana ──────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h2 className="font-kufi text-2xl sm:text-3xl font-bold text-slate-900 mb-3">ما هي المدوّنة؟</h2>
          <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
            المدوّنة هي منصة رقمية مجانية تهدف إلى تسهيل الوصول إلى النصوص القانونية المغربية.
            تجمع المنصة بين البساطة والشمولية، وتتيح للطلبة والمحامين والباحثين والمواطنين
            تصفّح القوانين والبحث فيها بسهولة.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: BookOpen, title: 'نصوص قانونية شاملة', desc: 'الدستور، المدونات، القوانين التنظيمية، المراسيم والنصوص التنظيمية' },
            { icon: Search, title: 'بحث متقدم', desc: 'بحث بالكلمات المفتاحية أو برقم المادة مع تصفية حسب القانون' },
            { icon: Zap, title: 'سريعة وخفيفة', desc: 'تصميم عصري وسريع يعمل على جميع الأجهزة بدون تحميل' },
            { icon: Globe, title: 'متاحة للجميع', desc: 'مجانية ومفتوحة — لا تسجيل مطلوب لتصفّح النصوص' },
            { icon: Shield, title: 'مصدر موثوق', desc: 'جميع النصوص مصدرها الجريدة الرسمية للمملكة المغربية' },
            { icon: Smartphone, title: 'تطبيق على هاتفك', desc: 'ثبّتها كتطبيق على هاتفك — تعمل حتى بدون إنترنت' },
          ].map((f, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5
                                    hover:shadow-md hover:border-blue-200 transition-all">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Install as App (PWA) ──────────────────────────────── */}
      <section id="install" className="bg-gradient-to-b from-blue-50 to-slate-50">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full
                            px-4 py-1.5 text-sm font-medium mb-4">
              <Download className="w-4 h-4" />
              ثبّت التطبيق مجاناً
            </div>
            <h2 className="font-kufi text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              ثبّت المدوّنة على هاتفك
            </h2>
            <p className="text-slate-600 max-w-lg mx-auto">
              المدوّنة تطبيق ويب تقدّمي (PWA) — يمكنك تثبيتها مباشرة من المتصفح بدون الحاجة لمتجر التطبيقات
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Android / Chrome */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.523 2.243l-1.443 2.584A9.98 9.98 0 0 0 12 3.5a9.98 9.98 0 0 0-4.08 1.327L6.477 2.243a.5.5 0 0 0-.868.496l1.427 2.556A9.95 9.95 0 0 0 2 14h20a9.95 9.95 0 0 0-5.036-8.705l1.427-2.556a.5.5 0 0 0-.868-.496zM8.5 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm7 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM2 16v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4H2z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Android / Chrome</h3>
                  <p className="text-xs text-slate-500">Google Chrome على أندرويد أو الحاسوب</p>
                </div>
              </div>

              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-700
                                   rounded-lg text-sm font-bold shrink-0">1</span>
                  <div>
                    <p className="text-sm text-slate-700">افتح موقع المدوّنة في متصفح <strong>Chrome</strong></p>
                    <p className="text-xs text-slate-400 mt-0.5">almudawwana-v3.vercel.app</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-700
                                   rounded-lg text-sm font-bold shrink-0">2</span>
                  <div className="flex items-start gap-2">
                    <p className="text-sm text-slate-700">
                      اضغط على <strong>القائمة</strong> <MoreVertical className="w-4 h-4 inline text-slate-500" /> (النقاط الثلاث) في الأعلى
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-700
                                   rounded-lg text-sm font-bold shrink-0">3</span>
                  <p className="text-sm text-slate-700">
                    اختر <strong>&laquo;تثبيت التطبيق&raquo;</strong> أو <strong>&laquo;إضافة إلى الشاشة الرئيسية&raquo;</strong>
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-7 h-7 bg-green-100 text-green-700
                                   rounded-lg text-sm font-bold shrink-0">4</span>
                  <p className="text-sm text-slate-700">
                    اضغط <strong>&laquo;تثبيت&raquo;</strong> — ستظهر أيقونة التطبيق على شاشتك الرئيسية
                  </p>
                </li>
              </ol>
            </div>

            {/* iPhone / Safari */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-700" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">iPhone / iPad</h3>
                  <p className="text-xs text-slate-500">Safari على أجهزة Apple</p>
                </div>
              </div>

              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-700
                                   rounded-lg text-sm font-bold shrink-0">1</span>
                  <div>
                    <p className="text-sm text-slate-700">افتح موقع المدوّنة في متصفح <strong>Safari</strong></p>
                    <p className="text-xs text-slate-400 mt-0.5">almudawwana-v3.vercel.app</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-700
                                   rounded-lg text-sm font-bold shrink-0">2</span>
                  <div className="flex items-start gap-2">
                    <p className="text-sm text-slate-700">
                      اضغط على زر <strong>المشاركة</strong> <ArrowUpFromLine className="w-4 h-4 inline text-blue-500" /> في شريط الأدوات السفلي
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-700
                                   rounded-lg text-sm font-bold shrink-0">3</span>
                  <p className="text-sm text-slate-700">
                    مرّر للأسفل واختر <strong>&laquo;إضافة إلى الشاشة الرئيسية&raquo;</strong> <PlusSquare className="w-4 h-4 inline text-slate-500" />
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-7 h-7 bg-green-100 text-green-700
                                   rounded-lg text-sm font-bold shrink-0">4</span>
                  <p className="text-sm text-slate-700">
                    اضغط <strong>&laquo;إضافة&raquo;</strong> — ستظهر أيقونة التطبيق على شاشتك الرئيسية
                  </p>
                </li>
              </ol>
            </div>
          </div>

          {/* Desktop tip */}
          <div className="max-w-4xl mx-auto mt-6">
            <div className="bg-white/80 rounded-xl border border-slate-200 p-4 flex items-start gap-3">
              <Monitor className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-700">على الحاسوب</p>
                <p className="text-sm text-slate-500">
                  في Chrome أو Edge، ستظهر أيقونة التثبيت <Download className="w-3.5 h-3.5 inline text-slate-400" /> في شريط العنوان.
                  اضغط عليها واختر &laquo;تثبيت&raquo;.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Legal Disclaimer ──────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 mb-2">تنبيه قانوني</h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                منصة المدوّنة للمعلومات العامة فقط ولا تغني عن النصوص الرسمية المنشورة في الجريدة
                الرسمية للمملكة المغربية. لا تُعدّ المنصة استشارة قانونية. المصدر الرسمي الوحيد
                للنصوص القانونية هو{' '}
                <a href="https://www.sgg.gov.ma" target="_blank" rel="noopener noreferrer"
                   className="underline font-medium hover:text-amber-900">
                  الأمانة العامة للحكومة (sgg.gov.ma)
                </a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="bg-gradient-to-l from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14 text-center">
          <h2 className="font-kufi text-2xl sm:text-3xl font-bold mb-3">ابدأ باستكشاف القوانين المغربية</h2>
          <p className="text-blue-100 mb-6">تصفّح، ابحث، واستشهد — مجاناً وبدون تسجيل</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/codes"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold
                         px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
              <BookOpen className="w-5 h-5" />
              النصوص القانونية
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <ShareButton
              title="المدوّنة — الموسوعة القانونية المغربية"
              text="اكتشف المدوّنة — الموسوعة القانونية المغربية الشاملة"
              url={`${BASE_URL}/about`}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
