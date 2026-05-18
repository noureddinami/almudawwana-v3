'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  adminCodeRequests,
  AdminCodeRequest,
} from '@/lib/adminApi';
import {
  FilePlus2, Search, CheckCircle, XCircle, Clock, Eye,
  Trash2, ExternalLink, ChevronLeft, ChevronRight,
  AlertCircle, Loader2, MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:  { label: 'في الانتظار',  color: 'bg-amber-100 text-amber-700',   icon: Clock },
  reviewed: { label: 'قيد المراجعة', color: 'bg-blue-100 text-blue-700',     icon: Eye },
  added:    { label: 'تمت الإضافة',  color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  rejected: { label: 'مرفوض',        color: 'bg-red-100 text-red-700',        icon: XCircle },
};

export default function AdminCodeRequestsPage() {
  const [requests, setRequests]     = useState<AdminCodeRequest[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [lastPage, setLastPage]     = useState(1);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminCodeRequests.list({
        page,
        status: statusFilter || undefined,
        q: search || undefined,
      });
      setRequests(res.data);
      setTotal(res.total);
      setLastPage(res.last_page);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const adminNotes = noteInputs[id]?.trim() || undefined;
      await adminCodeRequests.update(id, { status, admin_notes: adminNotes });
      toast.success('تم التحديث');
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا الطلب؟')) return;
    try {
      await adminCodeRequests.destroy(id);
      toast.success('تم الحذف');
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ar-MA', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <FilePlus2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-kufi">طلبات إضافة نصوص قانونية</h1>
            <p className="text-sm text-slate-500">{total} طلب</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="بحث بعنوان النص أو الاسم أو البريد..."
              className="w-full pr-4 pl-10 py-2.5 text-sm border border-slate-200 rounded-xl
                         bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white
                     focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">جميع الحالات</option>
          <option value="pending">في الانتظار</option>
          <option value="reviewed">قيد المراجعة</option>
          <option value="added">تمت الإضافة</option>
          <option value="rejected">مرفوض</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">لا توجد طلبات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => {
            const st = STATUS_MAP[r.status] ?? STATUS_MAP.pending;
            const StIcon = st.icon;
            const isExpanded = expandedId === r.id;

            return (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-shadow hover:shadow-sm"
              >
                {/* Row header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-right"
                >
                  <div className={`shrink-0 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${st.color}`}>
                    <StIcon className="w-3 h-3" />
                    {st.label}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{r.code_title}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {r.name} — {r.email}
                    </p>
                  </div>

                  <span className="text-xs text-slate-400 shrink-0 hidden sm:inline">
                    {formatDate(r.created_at)}
                  </span>

                  <ChevronLeft className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isExpanded ? '-rotate-90' : ''}`} />
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500 text-xs">عنوان النص:</span>
                        <p className="font-medium text-slate-800">{r.code_title}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs">الرابط:</span>
                        {r.code_link ? (
                          <a
                            href={r.code_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {r.code_link.length > 50 ? r.code_link.slice(0, 50) + '...' : r.code_link}
                          </a>
                        ) : (
                          <p className="text-slate-400">—</p>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs">الاسم:</span>
                        <p className="text-slate-700">{r.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs">البريد:</span>
                        <p className="text-slate-700" dir="ltr">{r.email}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs">التاريخ:</span>
                        <p className="text-slate-700">{formatDate(r.created_at)}</p>
                      </div>
                    </div>

                    {r.notes && (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <span className="text-xs text-slate-500 block mb-1">ملاحظات المستخدم:</span>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{r.notes}</p>
                      </div>
                    )}

                    {r.admin_notes && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <span className="text-xs text-blue-500 block mb-1">ملاحظات الإدارة:</span>
                        <p className="text-sm text-blue-800 whitespace-pre-wrap">{r.admin_notes}</p>
                      </div>
                    )}

                    {/* Admin notes input */}
                    <div>
                      <label className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                        <MessageSquare className="w-3 h-3" />
                        ملاحظة الإدارة
                      </label>
                      <textarea
                        rows={2}
                        value={noteInputs[r.id] ?? r.admin_notes ?? ''}
                        onChange={e => setNoteInputs(prev => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="أضف ملاحظة..."
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white resize-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {r.status !== 'added' && (
                        <button
                          onClick={() => updateStatus(r.id, 'added')}
                          disabled={updatingId === r.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                                     bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          تمت الإضافة
                        </button>
                      )}
                      {r.status !== 'reviewed' && r.status !== 'added' && (
                        <button
                          onClick={() => updateStatus(r.id, 'reviewed')}
                          disabled={updatingId === r.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                                     bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          قيد المراجعة
                        </button>
                      )}
                      {r.status !== 'rejected' && (
                        <button
                          onClick={() => updateStatus(r.id, 'rejected')}
                          disabled={updatingId === r.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                                     bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          رفض
                        </button>
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                                   text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="p-2 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-600 px-3">
            {page} / {lastPage}
          </span>
          <button
            disabled={page >= lastPage}
            onClick={() => setPage(p => p + 1)}
            className="p-2 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
