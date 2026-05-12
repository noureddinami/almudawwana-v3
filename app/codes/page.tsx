import Link from 'next/link';
import { codes } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FileText, Scale, ChevronLeft, Search, BookOpen } from 'lucide-react';

// export const revalidate - removed for testing

const TYPE_ORDER = ['constitution', 'organic_law', 'ordinary_law', 'code', 'decree_law'];

const TYPE_META: Record<string, { label: string; plural: string; cls: string; dot: string }> = {
  constitution: { label: 'دستور',            plural: 'الدساتير',               cls: 'bg-amber-50  text-amber-700',   dot: 'bg-amber-400'  },
  organic_law:  { label: 'قانون تنظيمي',     plural: 'القوانين التنظيمية',      cls: 'bg-violet-50 text-violet-700',  dot: 'bg-violet-400' },
  ordinary_law: { label: 'قانون',            plural: 'القوانين العادية',         cls: 'bg-teal-50   text-teal-700',    dot: 'bg-teal-400'   },
  code:         { label: 'مدونة',            plural: 'المدونات',                cls: 'bg-blue-50   text-blue-700',    dot: 'bg-blue-400'   },
  decree_law:   { label: 'مرسوم بقانون',     plural: 'المراسيم بقوانين',        cls: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400'  },
};

async function getAllCodes() {
  try {
    const r = await codes.listAll();
    return r.data ?? [];
  } catch {
    return [];
  }
}

export default async function CodesPage() {
  const allCodes  = await getAllCodes();
  const totalArticles = allCodes.reduce((s: number, c: any) => s + (c.total_articles ?? 0), 0);

  /* Group by type, preserving TYPE_ORDER */
  const grouped = TYPE_ORDER.reduce<Record<string, any[]>>((acc, type) => {
    const items = allCodes.filter((c: any) => c.type === type);
    if (items.length) acc[type] = items;
    return acc;
  }, {});

  /* Types not in TYPE_ORDER (safety net) */
  allCodes.forEach((c: any) => {
    if (!TYPE_ORDER.includes(c.type) && !grouped[c.type]) grouped[c.type] = [];
    if (!TYPE_ORDER.includes(c.type)) grouped[c.type].push(c);
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-l from-blue-800 to-blue-900 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-kufi text-2xl font-bold">جميع القوانين والمدونات</h1>
          </div>
          <p className="text-blue-200 text-sm max-w-xl leading-relaxed">
            {allCodes.length} قانون ومدونة تضم أكثر من{' '}
            <span className="text-white font-bold">{totalArticles.toLocaleString('ar-MA')}</span>{' '}
            مادة قانونية — المصدر: الجريدة الرسمية المغربية
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(grouped).map(([type, items]) => {
              const meta = TYPE_META[type] ?? { plural: type, dot: 'bg-slate-400' };
              return (
                <a key={type} href={`#${type}`}
                   className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20
                              border border-white/15 text-blue-100 px-3 py-1.5 rounded-full transition-colors">
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {meta.plural} ({items.length})
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Breadcrumb + search link ────────────────────────── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/" className="hover:text-blue-600">الرئيسية</Link>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800 font-medium">القوانين</span>
          </nav>
          <Link href="/search"
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
            <Search className="w-3.5 h-3.5" />
            البحث المتقدم
          </Link>
        </div>
      </div>

      {/* ── Grouped sections ───────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-12 flex-1 w-full">
        {Object.entries(grouped).map(([type, items]) => {
          const meta = TYPE_META[type] ?? {
            label: type, plural: type,
            cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400',
          };
          return (
            <section key={type} id={type}>
              {/* Group header */}
              <div className="flex items-center gap-3 mb-5">
                <span className={`w-3 h-3 rounded-full shrink-0 ${meta.dot}`} />
                <h2 className="font-kufi text-xl font-bold text-slate-900">{meta.plural}</h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                  {items.length}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((code: any) => (
                  <Link
                    key={code.id}
                    href={`/codes/${code.slug}`}
                    className="group bg-white rounded-2xl border border-slate-200 shadow-sm
                               hover:shadow-md hover:border-blue-300 transition-all duration-200 p-5
                               flex flex-col"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center
                                      group-hover:bg-blue-100 transition-colors shrink-0">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm leading-snug
                                       group-hover:text-blue-700 transition-colors">
                          {code.title_ar}
                        </h3>
                        {code.title_fr && (
                          <p className="text-xs text-slate-400 truncate mt-0.5" dir="ltr">
                            {code.title_fr}
                          </p>
                        )}
                      </div>
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400
                                             transition-colors shrink-0 mt-0.5" />
                    </div>

                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.cls}`}>
                        {meta.label}
                      </span>
                      {code.total_articles > 0 ? (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {code.total_articles} مادة
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">قريباً</span>
                      )}
                      {code.promulgation_date && (
                        <span className="text-xs text-slate-400 mr-auto">
                          {new Date(code.promulgation_date).getFullYear()}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {allCodes.length === 0 && (
          <div className="text-center py-24 text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>لا توجد قوانين متاحة حالياً</p>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 pt-4 border-t border-slate-200">
          جميع النصوص مصدرها الجريدة الرسمية للمملكة المغربية —{' '}
          <a href="https://www.sgg.gov.ma" target="_blank" rel="noopener noreferrer"
             className="underline hover:text-slate-600">sgg.gov.ma</a>
        </p>
      </main>

      <Footer />
    </div>
  );
}
