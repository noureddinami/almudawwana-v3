'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminComments, AdminComment } from '@/lib/adminApi';
import { PaginatedResponse } from '@/lib/api';
import {
  Search, ChevronLeft, ChevronRight, RefreshCw,
  MessageSquare, CheckCircle, XCircle, Trash2, Clock, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';

const STATUSES = ['pending', 'approved', 'rejected'];
const STATUS_LABEL: Record<string, string> = {
  pending: 'قيد المراجعة', approved: 'منشور', rejected: 'مرفوض',
};
const STATUS_COLOR: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}س`;
  return `${Math.floor(h / 24)}ي`;
}

export default function AdminCommentsPage() {
  const [data, setData]       = useState<PaginatedResponse<AdminComment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState('');
  const [status, setStatus]   = useState('pending');
  const [page, setPage]       = useState(1);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminComment | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminComments.list({ q: q || undefined, status: status || undefined, page })
      .then(setData)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [q, status, page]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    try {
      await adminComments.update(id, { status: 'approved' });
      toast.success('تم نشر التعليق');
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const submitReject = async () => {
    if (!rejectId) return;
    try {
      await adminComments.update(rejectId, { status: 'rejected', rejection_reason: rejectReason || undefined });
      toast.success('تم رفض التعليق');
      setRejectId(null);
      setRejectReason('');
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await adminComments.destroy(deleteTarget.id);
    toast.success('تم حذف التعليق');
    setDeleteTarget(null);
    load();
  };

  const pending = data?.data.filter(c => c.status === 'pending').length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-kufi">إدارة التعليقات</h1>
          {status === 'pending' && pending > 0 && (
            <p className="text-sm text-amber-600 mt-0.5">{pending} تعليق بانتظار المراجعة</p>
          )}
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600">
          <RefreshCw className="w-4 h-4" />تحديث
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="بحث في محتوى التعليقات..."
            className="w-full pr-9 pl-3 py-2 text-sm border border-slate-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          <button onClick={() => { setStatus(''); setPage(1); }}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors
                        ${!status ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            الكل
          </button>
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors
                          ${status === s ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data?.data.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 bg-white rounded-xl border border-slate-200 text-slate-400">
            <MessageSquare className="w-5 h-5" />
            <p className="text-sm">لا توجد تعليقات</p>
          </div>
        ) : (
          data?.data.map(c => (
            <div key={c.id}
              className={`bg-white rounded-xl border p-4 space-y-3
                          ${c.status === 'pending' ? 'border-amber-200' : 'border-slate-200'}`}>
              {/* Meta */}
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-800">
                      {c.author?.full_name ?? c.author?.email ?? 'مجهول'}
                    </span>
                    {c.author?.email && (
                      <span className="text-xs text-slate-400">{c.author.email}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[c.status]}`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 mr-auto">
                      <Clock className="w-3 h-3" />{timeAgo(c.created_at)}
                    </span>
                  </div>
                  {c.article && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      الفصل {c.article.number}
                      {c.article.code && ` — ${c.article.code.title_ar}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Content */}
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg px-4 py-3 whitespace-pre-wrap">
                {c.content_ar}
              </p>

              {/* Rejection reason */}
              {c.status === 'rejected' && c.rejection_reason && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  سبب الرفض: {c.rejection_reason}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                {c.status !== 'approved' && (
                  <button onClick={() => approve(c.id)}
                    className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white
                               px-3 py-1.5 rounded-lg hover:bg-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5" />نشر
                  </button>
                )}
                {c.status !== 'rejected' && (
                  <button onClick={() => { setRejectId(c.id); setRejectReason(''); }}
                    className="flex items-center gap-1.5 text-xs bg-amber-500 text-white
                               px-3 py-1.5 rounded-lg hover:bg-amber-600">
                    <XCircle className="w-3.5 h-3.5" />رفض
                  </button>
                )}
                <button onClick={() => setDeleteTarget(c)}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 mr-auto">
                  <Trash2 className="w-3.5 h-3.5" />حذف
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">{data.from}–{data.to} من {data.total}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-600">{page} / {data.last_page}</span>
            <button onClick={() => setPage(p => Math.min(data.last_page, p + 1))} disabled={page === data.last_page}
              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">رفض التعليق</h3>
              <button onClick={() => setRejectId(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  سبب الرفض <span className="text-slate-400 font-normal">(اختياري)</span>
                </label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  rows={3} placeholder="اذكر سبب الرفض للمستخدم..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none
                             focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setRejectId(null)}
                  className="flex-1 px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
                  إلغاء
                </button>
                <button onClick={submitReject}
                  className="flex-1 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium">
                  تأكيد الرفض
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDeleteModal
          title="حذف التعليق"
          warning="سيتم حذف هذا التعليق نهائياً."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
