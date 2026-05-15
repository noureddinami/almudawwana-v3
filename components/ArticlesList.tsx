'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Article {
  id: string;
  number: string;
  number_int: number | null;
  slug: string;
  content_ar: string;
  section?: { title_ar: string } | null;
}

interface Pagination {
  current: number;
  last: number;
  total: number;
}

interface Props {
  articles: Article[];
  slug: string;
  pagination: Pagination | null;
  currentPage: number;
}

function truncate(text: string, max = 200): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

export default function ArticlesList({ articles, slug, pagination, currentPage }: Props) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p>لا توجد مواد متاحة حالياً</p>
      </div>
    );
  }

  return (
    <div>
      {/* Count */}
      {pagination && (
        <p className="text-sm text-slate-500 mb-5">
          عرض{' '}
          <span className="font-medium text-slate-700">
            {(currentPage - 1) * 50 + 1}–{Math.min(currentPage * 50, pagination.total)}
          </span>{' '}
          من {pagination.total} مادة
        </p>
      )}

      {/* Articles */}
      <div className="space-y-3">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/codes/${slug}/articles/${article.id}`}
            prefetch={false}
            className="block bg-white rounded-xl border border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4
                       hover:border-blue-300 hover:shadow-sm transition-all duration-150 group
                       active:scale-[0.99] active:bg-slate-50"
          >
            <div className="flex items-start gap-2.5 sm:gap-3">
              <span className="shrink-0 text-[11px] sm:text-xs font-bold text-blue-700 bg-blue-50
                               px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg mt-0.5 whitespace-nowrap">
                م. {article.number}
              </span>
              <div className="flex-1 min-w-0">
                {article.section?.title_ar && (
                  <p className="text-[11px] sm:text-xs text-slate-400 mb-0.5 sm:mb-1 truncate">{article.section.title_ar}</p>
                )}
                <p className="text-slate-600 text-[13px] sm:text-sm leading-relaxed text-arabic line-clamp-3">
                  {truncate(article.content_ar, 160)}
                </p>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-blue-400
                                     transition-colors shrink-0 mt-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.last > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {currentPage > 1 && (
            <Link
              href={`/codes/${slug}?page=${currentPage - 1}`}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-white border border-slate-200
                         rounded-lg hover:bg-slate-50 hover:border-blue-300 transition-colors text-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
              السابق
            </Link>
          )}

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(pagination.last, 7) }, (_, i) => {
              let p: number;
              if (pagination.last <= 7) {
                p = i + 1;
              } else if (currentPage <= 4) {
                p = i + 1;
              } else if (currentPage >= pagination.last - 3) {
                p = pagination.last - 6 + i;
              } else {
                p = currentPage - 3 + i;
              }
              return (
                <Link
                  key={p}
                  href={`/codes/${slug}?page=${p}`}
                  className={`w-9 h-9 flex items-center justify-center text-sm rounded-lg transition-colors
                    ${p === currentPage
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-blue-300'
                    }`}
                >
                  {p}
                </Link>
              );
            })}
          </div>

          {currentPage < pagination.last && (
            <Link
              href={`/codes/${slug}?page=${currentPage + 1}`}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-white border border-slate-200
                         rounded-lg hover:bg-slate-50 hover:border-blue-300 transition-colors text-slate-700"
            >
              التالي
              <ChevronLeft className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
