'use client';

import Link from 'next/link';
import type { JurisTag } from '@/lib/jurisprudence-types';

interface Props {
  tag: Pick<JurisTag, 'code_slug' | 'article_number' | 'display_label'>
  size?: 'sm' | 'md'
}

export default function ArticleTag({ tag, size = 'sm' }: Props) {
  const href = `/codes/${tag.code_slug}/المادة-${tag.article_number}`
  const cls = size === 'sm'
    ? 'text-[11px] px-2 py-0.5'
    : 'text-xs px-2.5 py-1'

  return (
    <Link
      href={href}
      className={`
        inline-flex items-center gap-1 rounded-full border font-medium transition-all duration-150
        bg-blue-50 text-blue-700 border-blue-200
        hover:bg-blue-600 hover:text-white hover:border-blue-600
        ${cls}
      `}
    >
      {tag.display_label}
    </Link>
  )
}
