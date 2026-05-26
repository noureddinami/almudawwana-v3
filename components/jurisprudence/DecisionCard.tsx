'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Calendar, Hash, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { Decision } from '@/lib/jurisprudence-types';
import { CHAMBER_LABELS, chamberColor } from '@/lib/jurisprudence-types';
import ArticleTag from './ArticleTag';

interface Props {
  decision: Decision
  showFullLink?: boolean // link to /jurisprudence/[id]
}

export default function DecisionCard({ decision, showFullLink = true }: Props) {
  const [expanded, setExpanded] = useState(false);
  const colors  = chamberColor(decision.chamber_slug);
  const chamber = CHAMBER_LABELS[decision.chamber_slug ?? ''] ?? 'غير محدد';
  const tags    = decision.tags ?? [];

  const formattedDate = decision.decision_date
    ? new Date(decision.decision_date).toLocaleDateString('ar-MA', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : null;

  return (
    <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">

      {/* Bande couleur chambre */}
      <div className={`h-1 ${colors.bar}`} />

      <div className="p-4 sm:p-5">

        {/* Header : chambre + date + rqm */}
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${colors.bg} ${colors.text} ${colors.border}`}>
              {chamber}
            </span>
            {decision.decision_nature && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                {decision.decision_nature}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </span>
            )}
            <span className="flex items-center gap-1 font-mono">
              <Hash className="w-3 h-3" />
              {decision.case_number}
            </span>
          </div>
        </div>

        {/* Subject */}
        {decision.subject_short && (
          <p className="text-sm text-slate-800 leading-relaxed font-amiri mb-3">
            {expanded && decision.subject
              ? decision.subject
              : decision.subject_short}
            {decision.subject && decision.subject.length > 150 && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="mr-2 inline-flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-800"
              >
                {expanded ? (<><ChevronUp className="w-3 h-3" />أقل</>) : (<><ChevronDown className="w-3 h-3" />المزيد</>)}
              </button>
            )}
          </p>
        )}

        {/* Article Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map(tag => (
              <ArticleTag key={tag.id} tag={tag} />
            ))}
          </div>
        )}

        {/* Footer : PDF + détail */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          {decision.pdf_url && (
            <a
              href={decision.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-white bg-[#2152cc] hover:bg-[#1a43a8]
                         px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              نص القرار
            </a>
          )}
          {showFullLink && (
            <Link
              href={`/jurisprudence/${decision.id}`}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mr-auto"
            >
              <ExternalLink className="w-3 h-3" />
              التفاصيل
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
