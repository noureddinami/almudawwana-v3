import type { Metadata } from 'next';
import Link from 'next/link';
import { RecentNote } from '@/lib/api';
import { createPublicClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CacheHydrator from '@/components/CacheHydrator';
import {
  BookOpen, FileText, Scale, ChevronLeft, Search,
  MessageSquare, StickyNote, CheckCircle, Hash,
  AlignLeft, Tags, Shield, Smartphone, Zap, BookMarked,
  Sparkles, Clock, Share2,
} from 'lucide-react';
import ShareButton from '@/components/ShareButton';

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://modawana.app'

export const metadata: Metadata = {
  title: 'المدوّنة — الموسوعة القانونية المغربية',
  description: 'الموسوعة القانونية المغربية الشاملة — تصفّح الدستور، القوانين التنظيمية، المدونات والمراسيم بقوانين. جميع النصوص مجانية ومتاحة للجميع.',
  openGraph: {
    title: 'المدوّنة — الموسوعة القانونية المغربية',
    description: 'تصفّح جميع القوانين والمدونات المغربية مجاناً — المصدر: الجريدة الرسمية',
    url: BASE_URL,
    type: 'website',
    locale: 'ar_MA',
    siteName: 'المدوّنة — Al-Mudawwana',
    images: [{ url: `${BASE_URL}/icon-512x512.png`, width: 512, height: 512 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'المدوّنة — الموسوعة القانونية المغربية',
    description: 'تصفّح جميع القوانين والمدونات المغربية مجاناً',
  },
  alternates: {
    canonical: BASE_URL,
  },
}

async function getCodes() {
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('codes')
      .select('id, slug, title_ar, title_fr, type, status, total_articles, promulgation_date, created_at')
      .order('title_ar')
    return data ?? []
  } catch { return [] }
}

async function getLatestCodes() {
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('codes')
      .select('id, slug, title_ar, title_fr, type, status, total_articles, created_at')
      .order('created_at', { ascending: false })
      .limit(3)
    return data ?? []
  } catch { return [] }
}

async function getRecentNotes(): Promise<RecentNote[]> {
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('commentaries')
      .select('id, content_ar, created_at, article:articles(id, slug, number, code:codes(slug, title_ar))')
      .eq('type', 'annotation')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(6)
    return (data as any[]) ?? []
  } catch { return [] }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  if (d < 30) return `منذ ${d} يوم`;
  return new Date(dateStr).toLocaleDateString('ar-MA', { month: 'short', year: 'numeric' });
}

function typeLabel(type: string) {
  const map: Record<string, { label: string; cls: string }> = {
    code:          { label: 'مدونة',    cls: 'bg-blue-50   text-blue-700'  },
    ordinary_law:  { label: 'قانون',    cls: 'bg-teal-50   text-teal-700'  },
    organic_law:   { label: 'تنظيمي',   cls: 'bg-violet-50 text-violet-700' },
    constitution:  { label: 'دستور',    cls: 'bg-amber-50  text-amber-700'  },
    decree_law:    { label: 'مرسوم',    cls: 'bg-slate-100 text-slate-600'  },
  };
  return map[type] ?? { label: type, cls: 'bg-slate-100 text-slate-600' };
}

export default async function HomePage() {
  const [codesList, latestCodes, recentNotes] = await Promise.all([
    getCodes(),
    getLatestCodes(),
    getRecentNotes(),
  ]);
  const totalArticles = codesList.reduce((s: number, c: any) => s + (c.total_articles ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
      <CacheHydrator store="codes" cacheKey="all" data={codesList} />
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white
                          pt-10 pb-12 sm:pt-20 sm:pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-20 w-96 h-64 bg-blue-300 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          {/* Logo */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-2xl sm:rounded-3xl flex items-center justify-center
                            backdrop-blur-sm shadow-2xl border border-white/20">
              <img src="/logo.svg" alt="المدوّنة" className="w-10 h-10 sm:w-16 sm:h-16" />
            </div>
          </div>

          <div className="inline-block bg-white/10 border border-white/20 text-blue-100 text-[11px] sm:text-xs
                          px-3 py-1 sm:px-4 sm:py-1.5 rounded-full mb-3 sm:mb-4 backdrop-blur-sm">
            موسوعتك القانونية المغربية — مجانية وشاملة
          </div>

          <h1 className="font-kufi text-4xl sm:text-6xl font-bold mb-3 sm:mb-4 tracking-wide">المدوّنة</h1>
          <p className="text-blue-100 text-base sm:text-xl mb-2 sm:mb-3 leading-relaxed">
            الوصول السهل إلى القانون المغربي
          </p>
          <p className="text-blue-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed px-2">
            ابحث وتصفّح أكثر من{' '}
            <span className="font-bold text-white text-base sm:text-lg">{totalArticles.toLocaleString('en')}</span>{' '}
            مادة قانونية من القوانين والمدونات المغربية الرسمية
          </p>

          {/* Search CTA */}
          <div className="mt-6 sm:mt-8 max-w-xl mx-auto">
            <Link
              href="/search"
              className="flex items-center gap-3 w-full px-4 py-3.5 sm:px-5 sm:py-4 bg-white/10 border border-white/25
                         rounded-2xl text-right text-blue-100 hover:bg-white/20 transition-all
                         backdrop-blur-sm group shadow-lg active:scale-[0.98]"
            >
              <Search className="w-5 h-5 text-blue-200 group-hover:text-white shrink-0" />
              <span className="text-sm flex-1">ابحث في القوانين المغربية...</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-lg text-blue-100 shrink-0">
                ابحث الآن
              </span>
            </Link>
          </div>

          {/* Stats — grille 2x2 sur mobile, ligne sur desktop */}
          <div className="mt-6 sm:mt-10 grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2.5 sm:gap-4 text-sm">
            {[
              { value: codesList.length.toString(), label: 'قانون ومدونة', href: '/codes' },
              { value: totalArticles.toLocaleString('en'), label: 'مادة قانونية', href: '/codes' },
              { value: '3', label: 'أوضاع بحث', href: '/search' },
              { value: 'مجاني', label: 'وصول حر للجميع', href: '/about' },
            ].map((s, i) => (
              <Link key={i} href={s.href}
                className="bg-white/10 backdrop-blur-sm px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl border border-white/15
                           sm:min-w-[110px] hover:bg-white/20 transition-all cursor-pointer active:scale-95">
                <div className="font-bold text-xl sm:text-2xl text-white font-kufi">{s.value}</div>
                <div className="text-blue-200 text-[10px] sm:text-xs mt-0.5">{s.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 1. القوانين المتاحة (6 premiers) ────────────────── */}
      <section id="codes" className="max-w-6xl mx-auto px-4 py-8 sm:py-12 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-kufi text-xl sm:text-2xl font-bold text-slate-900">القوانين المتاحة</h2>
            <p className="text-slate-500 text-sm mt-1">
              {codesList.length} قانون ومدونة — المصدر: الجريدة الرسمية المغربية
            </p>
          </div>
          <Link href="/codes" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
            عرض الكل
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        {codesList.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>لا توجد قوانين متاحة حالياً</p>
          </div>
        ) : (() => {
          const perCol = 7;
          const col1 = codesList.slice(0, perCol);
          const col2 = codesList.slice(perCol, perCol * 2);
          const col3 = codesList.slice(perCol * 2, perCol * 3);

          const CodeItem = ({ code }: { code: any }) => {
            const badge = typeLabel(code.type);
            return (
              <Link
                href={`/codes/${code.slug}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50/50 transition-colors group"
              >
                <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${badge.cls}`}>
                  {badge.label}
                </span>
                <span className="flex-1 min-w-0 text-sm font-medium text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                  {code.title_ar}
                </span>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400 shrink-0" />
              </Link>
            );
          };

          return (
            <>
              {/* Desktop: 3 colonnes */}
              <div className="hidden sm:grid sm:grid-cols-3 gap-4">
                {[col1, col2, col3].map((col, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                    {col.map((code: any) => (
                      <CodeItem key={code.id} code={code} />
                    ))}
                  </div>
                ))}
              </div>

              {/* Mobile: 1 seule liste de 7 */}
              <div className="sm:hidden bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                {col1.map((code: any) => (
                  <CodeItem key={code.id} code={code} />
                ))}
              </div>

              {/* Bouton "عرض الكل" */}
              {codesList.length > perCol && (
                <div className="mt-5 text-center">
                  <Link
                    href="/codes"
                    className="inline-flex items-center gap-2 bg-white border border-slate-200
                               hover:border-blue-300 hover:shadow-md text-slate-700 hover:text-blue-700
                               px-8 py-3 rounded-xl text-sm font-medium transition-all shadow-sm"
                  >
                    <BookOpen className="w-4 h-4" />
                    عرض جميع القوانين ({codesList.length})
                  </Link>
                </div>
              )}
            </>
          );
        })()}
      </section>

      {/* ── 1b. آخر الإضافات ─────────────────────────────────── */}
      <section id="latest" className="max-w-6xl mx-auto px-4 py-12 w-full">
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-kufi text-xl font-bold text-slate-900">آخر الإضافات</h2>
              <p className="text-xs text-slate-400 mt-0.5">أحدث ما أُضيف إلى المنصة</p>
            </div>
          </div>
          <Link href="/codes" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            عرض الكل <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── أحدث القوانين ──────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> آخر القوانين المضافة
            </h3>
            <div className="space-y-3">
              {latestCodes.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">لا توجد إضافات بعد</p>
              ) : latestCodes.map((code: any) => {
                const badge = typeLabel(code.type);
                return (
                  <Link key={code.id} href={`/codes/${code.slug}`}
                    className="flex items-start gap-4 bg-white rounded-2xl border border-slate-200
                               hover:border-blue-300 hover:shadow-md p-4 transition-all group">
                    <div className="w-10 h-10 bg-blue-50 group-hover:bg-blue-100 rounded-xl
                                    flex items-center justify-center shrink-0 transition-colors">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 group-hover:text-blue-700
                                   transition-colors leading-snug">
                        {code.title_ar}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                        {code.total_articles > 0 && (
                          <span className="text-xs text-slate-400">{code.total_articles} مادة</span>
                        )}
                      </div>
                    </div>
                    {code.created_at && (
                      <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {timeAgo(code.created_at)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── آخر الملاحظات ──────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <StickyNote className="w-4 h-4" /> آخر الملاحظات على المواد
            </h3>
            <div className="space-y-3">
              {recentNotes.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">لا توجد ملاحظات بعد</p>
              ) : recentNotes.slice(0, 3).map((n: RecentNote) => (
                <div key={n.id}
                  className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                      <StickyNote className="w-3.5 h-3.5 shrink-0" />
                      {n.article ? (
                        <Link
                          href={`/codes/${n.article.code?.slug ?? '#'}/المادة-${n.article.number}`}
                          className="hover:underline"
                        >
                          م. {n.article.number}
                          {n.article.code && ` — ${n.article.code.title_ar}`}
                        </Link>
                      ) : 'ملاحظة'}
                    </div>
                    <span className="text-xs text-amber-500 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{timeAgo(n.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-amber-900 leading-relaxed line-clamp-3">
                    {n.content_ar}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. لماذا المدوّنة؟ ───────────────────────────────── */}
      <section id="features" className="bg-white border-y border-slate-100 py-10 sm:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-kufi text-2xl sm:text-3xl font-bold text-slate-900 mb-3">لماذا المدوّنة؟</h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto leading-relaxed">
              كل ما تحتاجه للبحث في القانون المغربي في مكان واحد، بشكل مرتب وسهل الاستخدام
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {[
              {
                icon: Search,
                color: 'blue',
                title: 'بحث متقدم ومتعدد الأوضاع',
                desc: 'ابحث بالنص الحر، أو برقم المادة مع تحديد القانون، أو بعدة كلمات مفتاحية دفعة واحدة',
              },
              {
                icon: BookOpen,
                color: 'teal',
                title: 'تصفّح شامل للقوانين',
                desc: 'جميع المدونات والقوانين التنظيمية والعادية مرتبة ومصنّفة بوضوح مع مواد مرقّمة بالترتيب الصحيح',
              },
              {
                icon: CheckCircle,
                color: 'green',
                title: 'حالة كل مادة',
                desc: 'كل مادة مُصنَّفة: سارية المفعول، مُعدَّلة، أو ملغاة — حتى تعرف دائماً ما هو نافذ',
              },
              {
                icon: MessageSquare,
                color: 'violet',
                title: 'تعليقات وآراء المستخدمين',
                desc: 'أضف تعليقك أو استفسارك على أي مادة قانونية، وتابع آراء القرّاء الآخرين بعد الموافقة عليها',
              },
              {
                icon: StickyNote,
                color: 'amber',
                title: 'ملاحظات الإدارة',
                desc: 'يضيف فريق المنصة ملاحظات توضيحية وتفسيرية مباشرة على المواد لتسهيل الفهم',
              },
              {
                icon: Shield,
                color: 'slate',
                title: 'مصادر رسمية موثوقة',
                desc: 'جميع النصوص مُستخرجة من الجريدة الرسمية للمملكة المغربية عبر sgg.gov.ma',
              },
            ].map((f, i) => {
              const Icon = f.icon;
              const colorMap: Record<string, string> = {
                blue:   'bg-blue-50 text-blue-600',
                teal:   'bg-teal-50 text-teal-600',
                green:  'bg-green-50 text-green-600',
                violet: 'bg-violet-50 text-violet-600',
                amber:  'bg-amber-50 text-amber-600',
                slate:  'bg-slate-100 text-slate-600',
              };
              return (
                <div key={i} className="bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-6
                                         hover:border-blue-200 hover:shadow-sm transition-all duration-200">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 ${colorMap[f.color]}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 sm:mb-2 leading-snug">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3. ثلاثة أوضاع للبحث ────────────────────────────── */}
      <section id="search" className="bg-gradient-to-br from-slate-900 to-blue-950 text-white py-10 sm:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-kufi text-2xl sm:text-3xl font-bold mb-3">ثلاثة أوضاع للبحث</h2>
            <p className="text-slate-300 text-base max-w-xl mx-auto">
              ابحث بالطريقة التي تناسبك — سواء كنت تعرف ما تبحث عنه أم لا
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: AlignLeft,
                num: '1',
                title: 'بحث بالنص الحر',
                desc: 'اكتب أي كلمة أو جملة وسيبحث النظام في محتوى جميع المواد القانونية',
                example: 'مثال: "عقد الإيجار" أو "الأحوال الشخصية"',
                color: 'from-blue-600 to-blue-700',
              },
              {
                icon: Hash,
                num: '2',
                title: 'بحث برقم المادة',
                desc: 'حدد القانون المطلوب ثم اكتب رقم المادة للوصول المباشر إليها',
                example: 'مثال: المادة 488 من قانون الالتزامات',
                color: 'from-teal-600 to-teal-700',
              },
              {
                icon: Tags,
                num: '3',
                title: 'بحث بكلمات متعددة',
                desc: 'أدخل عدة كلمات مفتاحية لتضييق نطاق البحث داخل قانون محدد',
                example: 'مثال: "الطلاق، النفقة، الحضانة"',
                color: 'from-violet-600 to-violet-700',
              },
            ].map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm
                                         hover:bg-white/10 transition-all duration-200">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center
                                    justify-center mb-4 shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-3xl font-kufi font-bold text-white/20 mb-2">{m.num}</div>
                  <h3 className="font-bold text-white text-base mb-2">{m.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">{m.desc}</p>
                  <p className="text-xs text-slate-400 bg-white/5 rounded-lg px-3 py-2">{m.example}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white
                         px-8 py-3 rounded-xl font-medium text-sm transition-colors shadow-lg"
            >
              <Search className="w-4 h-4" />
              جرّب البحث الآن
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. كيف تستخدم المنصة؟ ───────────────────────────── */}
      <section id="how" className="max-w-4xl mx-auto px-4 py-16 w-full">
        <div className="text-center mb-12">
          <h2 className="font-kufi text-3xl font-bold text-slate-900 mb-3">كيف تستخدم المنصة؟</h2>
          <p className="text-slate-500 text-sm">في ثلاث خطوات بسيطة</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              icon: Search,
              title: 'ابحث أو تصفّح',
              desc: 'اكتب ما تبحث عنه في خانة البحث، أو اختر القانون مباشرة من القائمة',
            },
            {
              step: '2',
              icon: FileText,
              title: 'اقرأ المادة',
              desc: 'اطّلع على نص المادة كاملاً مع بيان حالتها القانونية وملاحظات الإدارة إن وُجدت',
            },
            {
              step: '3',
              icon: MessageSquare,
              title: 'شارك برأيك',
              desc: 'سجّل دخولك وأضف تعليقك أو استفسارك على المادة وستظهر بعد المراجعة',
            },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Icon className="w-9 h-9 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-slate-900 text-white rounded-full
                                  flex items-center justify-center text-xs font-bold font-kufi shadow-md">
                    {s.step}
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 5. التعليقات التشاركية ───────────────────────────── */}
      <section id="comments" className="bg-blue-50 border-y border-blue-100 py-14 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs
                            px-3 py-1.5 rounded-full font-medium mb-4">
              <MessageSquare className="w-3.5 h-3.5" />
              التعليقات التشاركية
            </div>
            <h2 className="font-kufi text-2xl font-bold text-slate-900 mb-3 leading-snug">
              المعرفة تُبنى معاً
            </h2>
            <p className="text-slate-600 text-base leading-relaxed mb-4">
              يمكن لكل مستخدم إضافة تعليق أو ملاحظة على أي مادة قانونية.
              التعليقات تمرّ عبر مراجعة الإدارة قبل نشرها لضمان الجودة والدقة.
            </p>
            <ul className="space-y-2.5">
              {[
                'أضف تعليقاً على أي مادة قانونية',
                'اطّلع على تعليقات وآراء المستخدمين الآخرين',
                'تلقَّ ملاحظات توضيحية من فريق المنصة',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/login"
              className="inline-flex items-center gap-2 mt-6 bg-blue-600 hover:bg-blue-700
                         text-white text-sm px-6 py-2.5 rounded-xl font-medium transition-colors">
              سجّل وشارك برأيك
            </Link>
          </div>

          {/* Mockup */}
          <div className="w-full md:w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <BookMarked className="w-3.5 h-3.5" />
                <span>المادة 488 — قانون الالتزامات</span>
              </div>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-3 leading-relaxed">
                "هل هذا النص ينطبق على عقود الكراء المنزلي؟ أريد التوضيح حول شرط الأهلية."
              </p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center
                                text-white text-xs font-bold shrink-0">م</div>
                <div>
                  <p className="text-xs font-medium text-slate-800">محمد الأمين</p>
                  <p className="text-xs text-slate-400">منذ ساعتين</p>
                </div>
                <span className="mr-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                  منشور
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <StickyNote className="w-3.5 h-3.5" />
                ملاحظة الإدارة
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                "نعم، تنطبق هذه المادة على عقود الكراء السكني وفق الفصل 627 من ق.ل.ع."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-14 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-center">
          {[
            { icon: Zap,        color: 'text-yellow-500', title: 'سريع وخفيف',       desc: 'يعمل على جميع الأجهزة والاتصالات بدون تحميل إضافي' },
            { icon: Smartphone, color: 'text-blue-500',   title: 'متوافق مع الجوال', desc: 'واجهة مُصمَّمة خصيصاً للتصفح عبر الهاتف الذكي'    },
            { icon: Shield,     color: 'text-green-500',  title: 'نصوص موثوقة',      desc: 'مصدر كل نص هو الجريدة الرسمية للمملكة المغربية'   },
          ].map((v, i) => {
            const Icon = v.icon;
            return (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <Icon className={`w-8 h-8 mx-auto mb-3 ${v.color}`} />
                <h3 className="font-bold text-slate-900 text-base mb-1.5">{v.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <img src="/logo.svg" alt="المدوّنة" className="w-14 h-14 mx-auto mb-5 opacity-80" />
          <h2 className="font-kufi text-3xl font-bold mb-3">ابدأ الاستكشاف الآن</h2>
          <p className="text-blue-200 text-base leading-relaxed mb-8">
            المدوّنة متاحة مجاناً للجميع — طلاباً وأكاديميين ومهنيين ومواطنين عاديين.
            القانون لا يجب أن يكون غامضاً.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/search"
              className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50
                         px-8 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg">
              <Search className="w-4 h-4" />
              ابحث في القوانين
            </Link>
            <Link href="/login"
              className="inline-flex items-center gap-2 bg-white/15 border border-white/25
                         hover:bg-white/25 text-white px-8 py-3 rounded-xl font-medium
                         text-sm transition-colors">
              <MessageSquare className="w-4 h-4" />
              سجّل للمشاركة
            </Link>
            <ShareButton
              variant="button"
              title="المدوّنة — الموسوعة القانونية المغربية"
              text="المدوّنة — الموسوعة القانونية المغربية الشاملة. تصفّح جميع القوانين المغربية مجاناً."
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
