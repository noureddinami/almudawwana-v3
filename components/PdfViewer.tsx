'use client';

import { useEffect } from 'react';
import { X, Download, ExternalLink, FileText } from 'lucide-react';

interface PdfViewerProps {
  url:     string
  title:   string
  isOpen:  boolean
  onClose: () => void
}

export function PdfViewer({ url, title, isOpen, onClose }: PdfViewerProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Prevent body scroll when modal open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else        document.body.style.overflow = ''
    return ()  => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" dir="rtl">
      {/* Header */}
      <div className="bg-[#2152cc] text-white px-4 py-3 flex items-center gap-3 shrink-0
                      shadow-lg">
        <FileText className="w-4 h-4 shrink-0 opacity-80" />
        <h2 className="font-medium text-sm flex-1 truncate" title={title}>{title}</h2>
        <div className="flex items-center gap-2 shrink-0">
          {/* Download */}
          <a
            href={url}
            download
            className="flex items-center gap-1.5 text-xs bg-white/15 hover:bg-white/25
                       border border-white/25 px-3 py-1.5 rounded-lg font-semibold
                       transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            تحميل
          </a>
          {/* Open in new tab */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20
                       border border-white/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {/* Close */}
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg
                       bg-white/10 hover:bg-white/25 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF iframe — fills remaining height */}
      <iframe
        src={url}
        className="flex-1 w-full border-0 bg-slate-800"
        title={title}
        allow="fullscreen"
      />
    </div>
  )
}
