'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Mail, Search, CheckCircle, Clock, Eye, Archive,
  Trash2, ChevronLeft, ChevronRight,
  AlertCircle, Loader2, MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:  { label: 'جديد',         color: 'bg-amber-100 text-amber-700',     icon: Clock },
  read:     { label: 'مقروء',        color: 'bg-blue-100 text-blue-700',       icon: Eye },
  replied:  { label: 'تم الرد',      color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  archived: { label: 'مؤرشف',        color: 'bg-slate-100 text-slate-600',     icon: Archive },
};

export default function AdminContactMessagesPage() {
  const [messages, setMessages]         = useState<ContactMessage[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [lastPage, setLastPage]         = useState(1);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]             = useState('');
  const [searchInput, setSearchInput]   = useState('');
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [noteInputs, setNoteInputs]     = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('q', search);
      const res = await fetch(`/api/admin/contact-messages?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? json.message);
      setMessages(json.data);
      setTotal(json.total);
      setLastPage(json.last_page);
    } catch (e: any) {
      toast.error(e.message ?? 'خطأ في تحميل الرسائل');
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
      const body: Record<string, any> = { id, status };
      const note = noteInputs[id]?.trim();
      if (note !== undefined) body.admin_notes = note || null;
      const res = await fetch('/api/admin/contact-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      toast.success('تم التحديث');
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذه الرسالة؟')) return;
    try {
      const res = await fetch('/api/admin/contact-messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      toast.success('تم الحذف');
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ar-MA', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-kufi">رسائل التواصل</h1>
            <p className="text-sm text-slate-500">{total} رسالة</p>
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
              placeholder="بحث بالاسم أو البريد أو الموضوع..."
              className="w-full pr-4 pl-10 py-2.5 text-sm border border-slate-200 rounded-xl
                         bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">جميع الحالات</option>
          <option value="pending">جديد</option>
          <option value="read">مقروء</option>
          <option value="replied">تم الرد</option>
          <option value="archived">مؤرشف</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">لا توجد رسائل</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(m => {
            const st = STATUS_MAP[m.status] ?? STATUS_MAP.pending;
            const StIcon = st.icon;
            const isExpanded = expandedId === m.id;

            return (
              <div
                key={m.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-shadow hover:shadow-sm"
              >
                {/* Row header */}
                <button
                  onClick={() => {
                    setExpandedId(isExpanded ? null : m.id);
                    // Auto-mark as read when expanding a pending message
                    if (!isExpanded && m.status === 'pending') {
                      updateStatus(m.id, 'read');
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-right"
                >
                  <div className={`shrink-0 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${st.color}`}>
                    <StIcon className="w-3 h-3" />
                    {st.label}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${m.status === 'pending' ? 'text-slate-900' : 'text-slate-700'}`}>
                      {m.subject}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {m.name} — {m.email}
                    </p>
                  </div>

                  <span className="text-xs text-slate-400 shrink-0 hidden sm:inline">
                    {formatDate(m.created_at)}
                  </span>

                  <ChevronLeft className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isExpanded ? '-rotate-90' : ''}`} />
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500 text-xs">الاسم:</span>
                        <p className="font-medium text-slate-800">{m.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs">البريد:</span>
                        <p className="text-slate-700" dir="ltr">{m.email}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs">الموضوع:</span>
                        <p className="font-medium text-slate-800">{m.subject}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs">التاريخ:</span>
                        <p className="text-slate-700">{formatDate(m.created_at)}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3">
                      <span className="text-xs text-slate-500 block mb-1">الرسالة:</span>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{m.message}</p>
                    </div>

                    {m.admin_notes && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <span className="text-xs text-blue-500 block mb-1">ملاحظات الإدارة:</span>
                        <p className="text-sm text-blue-800 whitespace-pre-wrap">{m.admin_notes}</p>
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
                        value={noteInputs[m.id] ?? m.admin_notes ?? ''}
                        onChange={e => setNoteInputs(prev => ({ ...prev, [m.id]: e.target.value }))}
                        placeholder="أضف ملاحظة..."
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {m.status !== 'replied' && (
                        <button
                          onClick={() => updateStatus(m.id, 'replied')}
                          disabled={updatingId === m.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                                     bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          تم الرد
                        </button>
                      )}
                      {m.status !== 'archived' && (
                        <button
                          onClick={() => updateStatus(m.id, 'archived')}
                          disabled={updatingId === m.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                                     bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          أرشفة
                        </button>
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={() => handleDelete(m.id)}
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
