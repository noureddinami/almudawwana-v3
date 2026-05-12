import { notFound } from 'next/navigation';
import Link from 'next/link';
import { articles as articlesApi, codes } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CommentsSection from '@/components/CommentsSection';
import { ChevronLeft, Scale, ExternalLink, Eye, MessageSquare, BookMarked, StickyNote } from 'lucide-react';

// export const revalidate - removed for testing

interface Props {
  params: Promise<{ slug: string; number: string }>; // "number" = article slug
}

async function getArticle(articleSlug: string) {
  try {
    return await articlesApi.get(decodeURIComponent(articleSlug));
  } catch {
    return null;
  }
}

async function getCode(slug: string) {
  try {
    return await codes.get(slug);
  } catch {
    return null;
  }
}

const statusLabel: Record<string, { label: string; cls: string }> = {
  in_force:  { label: 'ساري المفعول',  cls: 'bg-green-50  text-green-700  border-green-200' },
  amended:   { label: 'مُعدَّل',        cls: 'bg-amber-50  text-amber-700  border-amber-200' },
  abrogated: { label: 'مُلغى',          cls: 'bg-red-50    text-red-700    border-red-200'   },
  draft:     { label: 'مشروع',          cls: 'bg-slate-100 text-slate-600  border-slate-200' },
};

export default async function ArticlePage({ params }: Props) {
  const { slug, number: articleSlug } = await params;

  const [article, code] = await Promise.all([
    getArticle(articleSlug),
    getCode(slug),
  ]);

  if (!article) notFound();

  const status = statusLabel[article.status] ?? statusLabel.in_force;
  const codeName = code?.title_ar ?? article.code?.title_ar ?? slug;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* ── Fil d'ariane ──────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500 flex-wrap">
            <Link href="/" className="hover:text-blue-600 transition-colors">القوانين</Link>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
            <Link href={`/codes/${slug}`} className="hover:text-blue-600 transition-colors truncate max-w-[200px]">
              {codeName}
            </Link>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800 font-medium">م. {article.number}</span>
          </nav>
        </div>
      </div>

      {/* ── Contenu principal ─────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* En-tête */}
          <div className="bg-gradient-to-l from-blue-700 to-blue-800 px-8 py-7">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-blue-200 text-xs font-medium mb-1">{codeName}</p>
                <h1 className="font-kufi text-2xl font-bold text-white leading-tight">
                  المادة {article.number}
                </h1>
                {article.section?.title_ar && (
                  <p className="text-blue-100 text-sm mt-2 leading-relaxed">
                    {article.section.title_ar}
                  </p>
                )}
              </div>

              {/* Statut */}
              <span className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border ${status.cls}`}
                    style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Texte de l'article */}
          <div className="px-8 py-9">
            <div className="text-slate-800 text-[1.05rem] leading-[2.3] text-arabic whitespace-pre-wrap
                            max-w-[70ch]">
              {article.content_ar}
            </div>

            {/* Traduction française si disponible */}
            {article.content_fr && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide" dir="ltr">
                  Version française
                </p>
                <p className="text-slate-600 text-sm leading-relaxed" dir="ltr">
                  {article.content_fr}
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span key={tag.id}
                        className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
                    {tag.name_ar}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pied de l'article : méta + source */}
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />{article.view_count} مشاهدة
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />{article.comment_count} تعليق
              </span>
              <span className="flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5" />المصدر :
                <a
                  href="https://www.sgg.gov.ma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  sgg.gov.ma <ExternalLink className="w-3 h-3" />
                </a>
              </span>
            </div>
          </div>
        </article>

        {/* ── Admin notes ──────────────────────────────────────── */}
        {article.admin_notes && article.admin_notes.length > 0 && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-200 bg-amber-100/60">
              <StickyNote className="w-4 h-4 text-amber-700" />
              <h3 className="text-sm font-bold text-amber-800">ملاحظات الإدارة</h3>
            </div>
            <div className="divide-y divide-amber-100">
              {article.admin_notes.map(note => (
                <div key={note.id} className="px-5 py-4">
                  <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
                    {note.content_ar}
                  </p>
                  {note.author?.full_name && (
                    <p className="mt-2 text-xs text-amber-600">— {note.author.full_name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Disclaimer article ────────────────────────────────── */}
        <div className="mt-5 p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 leading-relaxed">
          ⚠️ هذا النص للمعلومات العامة فقط —{' '}
          <strong>لا يُعدّ مرجعاً قانونياً رسمياً</strong>.
          يُرجى الرجوع إلى النص الرسمي في الجريدة الرسمية للمملكة المغربية{' '}
          <a href="https://www.sgg.gov.ma" target="_blank" rel="noopener noreferrer"
             className="underline font-medium hover:text-amber-900">
            (sgg.gov.ma)
          </a>{' '}
          أو استشارة محامٍ مؤهّل.
        </div>

        {/* ── User comments ────────────────────────────────────── */}
        <CommentsSection articleSlug={articleSlug} initialCount={article.comment_count} />

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Link
            href={`/codes/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            العودة إلى {codeName}
          </Link>
          <Link
            href="/search"
            className="text-sm text-slate-400 hover:text-blue-600"
          >
            بحث في القوانين ←
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
