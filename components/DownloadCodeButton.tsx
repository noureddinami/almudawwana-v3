'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, Check, Trash2, Loader2, WifiOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  saveOfflineCode, isCodeOffline, deleteOfflineCode,
  type OfflineCode, type OfflineArticle,
} from '@/lib/cache';
import toast from 'react-hot-toast';

interface Props {
  codeId: string;
  codeTitle: string;
  codeTitleFr?: string | null;
  totalArticles: number;
}

export default function DownloadCodeButton({ codeId, codeTitle, codeTitleFr, totalArticles }: Props) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'downloading' | 'saved'>('checking');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    isCodeOffline(codeId).then(saved => {
      setStatus(saved ? 'saved' : 'idle');
    });
  }, [codeId]);

  const handleDownload = useCallback(async () => {
    setStatus('downloading');
    setProgress(0);

    try {
      const supabase = createClient();

      // Fetch ALL articles in batches of 500
      const allArticles: OfflineArticle[] = [];
      const batchSize = 500;
      let from = 0;
      let hasMore = true;

      // First get total count
      const { count } = await supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('code_id', codeId);

      const total = count ?? totalArticles;

      while (hasMore) {
        const { data, error } = await supabase
          .from('articles')
          .select('id, number, number_int, content_ar, content_fr, status, section:sections(title_ar)')
          .eq('code_id', codeId)
          .order('number_int', { ascending: true, nullsFirst: false })
          .order('number', { ascending: true })
          .range(from, from + batchSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }

        for (const a of data as any[]) {
          allArticles.push({
            id: a.id,
            number: a.number,
            number_int: a.number_int,
            content_ar: a.content_ar,
            content_fr: a.content_fr,
            section_title: Array.isArray(a.section) ? a.section[0]?.title_ar : a.section?.title_ar,
            status: a.status,
          });
        }

        from += batchSize;
        setProgress(Math.min(Math.round((allArticles.length / total) * 100), 99));

        if (data.length < batchSize) hasMore = false;
      }

      // Save to IndexedDB
      const offlineCode: OfflineCode = {
        id: codeId,
        title_ar: codeTitle,
        title_fr: codeTitleFr,
        articles: allArticles,
        downloaded_at: Date.now(),
        total_articles: allArticles.length,
      };

      await saveOfflineCode(offlineCode);
      setProgress(100);
      setStatus('saved');
      toast.success(`تم تحميل ${allArticles.length} مادة — متاح بدون إنترنت`);
    } catch (err) {
      console.error('Download failed:', err);
      setStatus('idle');
      toast.error('فشل التحميل — تحقق من اتصال الإنترنت');
    }
  }, [codeId, codeTitle, codeTitleFr, totalArticles]);

  const handleDelete = useCallback(async () => {
    await deleteOfflineCode(codeId);
    setStatus('idle');
    toast.success('تم حذف النسخة المحلية');
  }, [codeId]);

  if (status === 'checking') return null;

  // Already saved
  if (status === 'saved') {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
          <WifiOff className="w-3.5 h-3.5" />
          متاح بدون إنترنت
        </span>
        <button
          onClick={handleDelete}
          className="text-xs text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
          title="حذف النسخة المحلية"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Downloading
  if (status === 'downloading') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 min-w-[160px]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>جارٍ التحميل...</span>
          <span className="font-bold mr-auto">{progress}%</span>
        </div>
      </div>
    );
  }

  // Idle — show download button
  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100
                 px-3 py-2 rounded-lg border border-blue-200 transition-colors active:scale-95"
    >
      <Download className="w-3.5 h-3.5" />
      تحميل للقراءة بدون إنترنت
    </button>
  );
}
