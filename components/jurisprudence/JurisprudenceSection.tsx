'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Scale, Lock, ArrowLeft, FileText, Calendar, Hash } from 'lucide-react';
import type { Decision } from '@/lib/jurisprudence-types';
import { CHAMBER_LABELS, chamberColor } from '@/lib/jurisprudence-types';
import ArticleTag from './ArticleTag';

const FREE_LIMIT = 3;

interface Props {
  articleId: string
}

export default function JurisprudenceSection({ articleId }: Props) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!articleId) return;
    fetch(`/api/jurisprudence/by-article?article_id=${articleId}&limit=${FREE_LIMIT + 1}`)
      .then(r => r.json())
      .then(d => {
        setDecisions((d.decisions ?? []).slice(0, FREE_LIMIT));
        setTotal(d.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [articleId]);

  if (loading) return null;
  if (!decisions.length && total === 0) return null;

  return (
    <section className="mt-6" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <Scale className="w-4 h-4 text-[#2152cc]" />
        <h3 className="font-kufi font-bold text-slate-900 text-base">الاجتهاد القضائي</h3>
        {total > 0 && (
          <span className="text-xs bg-[#2152cc]/10 text-[#2152cc] px-2 py-0.5 rounded-full font-medium">
            {total} قرار
          </span>
        )}
      </div>

      <div className="space-y-3">
        {decisions.map(d => {
          const colors  = chamberColor(d.chamber_slug);
          const chamber = CHAMBER_LABELS[d.chamber_slug ?? ''] ?? '';
          const tags    = d.tags ?? [];
          return (
            <div key={d.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className={`h-0.5 ${colors.bar}`} />
              <div className="p-3.5">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${colors.bg} ${colors.text} ${colors.border}`}>
                    {chamber}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Hash className="w-2.5 h-2.5" />{d.case_number}
                  </span>
                  {d.decision_date && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-auto">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(d.decision_date).getFullYear()}
                    </span>
                  )}
                </div>

                {d.subject_short && (
                  <p className="text-sm text-slate-700 leading-relaxed font-amiri mb-2 line-clamp-2">
                    {d.subject_short}
                  </p>
                )}

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {tags.map(t => <ArticleTag key={t.id} tag={t} size="sm" />)}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100">
                  {d.pdf_url && (
                    <a href={d.pdf_url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1 text-xs text-[#2152cc] hover:text-[#1a43a8] font-medium">
                      <FileText className="w-3 h-3" />
                      نص القرار
                    </a>
                  )}
                  <Link href={`/jurisprudence/${d.id}`}
                        className="text-xs text-slate-400 hover:text-slate-600 mr-auto">
                    التفاصيل ←
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gate Pro */}
      {total > FREE_LIMIT && (
        <div className="mt-3 rounded-xl border border-[#2152cc]/20 bg-gradient-to-r from-[#2152cc]/5 to-blue-50 p-4">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-[#2152cc] mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 font-kufi">
                {total - FREE_LIMIT} قرار إضافي — المدوّنة Pro
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                اشترك للوصول إلى جميع قرارات محكمة النقض المرتبطة بهذه المادة
              </p>
            </div>
            <Link href="/jurisprudence"
                  className="shrink-0 flex items-center gap-1 text-xs bg-[#2152cc] text-white
                             px-3 py-1.5 rounded-lg hover:bg-[#1a43a8] transition-colors font-medium">
              عرض الكل
              <ArrowLeft className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
