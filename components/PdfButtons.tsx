'use client';

import { useState } from 'react';
import { Eye, Download } from 'lucide-react';
import { PdfViewer } from '@/components/PdfViewer';

interface PdfButtonsProps {
  url:   string
  title: string
  size?: 'sm' | 'md'
}

export function PdfButtons({ url, title, size = 'md' }: PdfButtonsProps) {
  const [open, setOpen] = useState(false)

  const base   = size === 'sm'
    ? 'flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg font-semibold transition-colors'
    : 'flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-semibold transition-colors'
  const iconSz = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'

  return (
    <>
      <div className="flex items-center gap-2">
        {/* مشاهدة */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
          className={`${base} bg-[#2152cc] text-white hover:bg-[#1a3fa0]`}
        >
          <Eye className={iconSz} />
          مشاهدة
        </button>

        {/* تحميل */}
        <a
          href={url}
          download
          onClick={e => e.stopPropagation()}
          className={`${base} border border-[#2152cc] text-[#2152cc] hover:bg-blue-50`}
        >
          <Download className={iconSz} />
          تحميل
        </a>
      </div>

      <PdfViewer url={url} title={title} isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
