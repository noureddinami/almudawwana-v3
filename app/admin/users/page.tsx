'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminUsers, AdminUser } from '@/lib/adminApi';
import { PaginatedResponse } from '@/lib/api';
import {
  Search, ChevronLeft, ChevronRight, RefreshCw,
  ShieldCheck, User, Ban, CheckCircle, Trash2, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES   = ['', 'reader', 'contributor', 'moderator', 'admin'];
const STATUSES = ['', 'active', 'suspended', 'banned', 'pending'];

const ROLE_LABEL: Record<string, string> = {
  reader: 'قارئ', contributor: 'مساهم', moderator: 'مشرف', admin: 'مدير',
};
const STATUS_LABEL: Record<string, string> = {
  active: 'نشط', suspended: 'موقوف', banned: 'محظور', pending: 'معلّق',
};
const STATUS_COLOR: Record<string, string> = {
  active:    'bg-emerald-100 text-emerald-700',
  suspended: 'bg-amber-100 text-amber-700',
  banned:    'bg-red-100 text-red-700',
  pending:   'bg-slate-100 text-slate-600',
};
const ROLE_COLOR: Record<string, string> = {
  admin:       'bg-purple-100 text-purple-700',
  moderator:   'bg-blue-100 text-blue-700',
  contributor: 'bg-teal-100 text-teal-700',
  reader:      'bg-slate-100 text-slate-600',
};

export default function AdminUsersPage() {
  const [data, setData]       = useState<PaginatedResponse<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState('');
  const [role, setRole]       = useState('');
  const [status, setStatus]   = useState('');
  const [page, setPage]       = useState(1);
  const [editing, setEditing] = useState<string | null>(null);
  const [editRole, setEditRole]     = useState('');
  const [editStatus, setEditStatus] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminUsers.list({ q: q || undefined, role: role || undefined, status: status || undefined, page })
      .then(setData)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [q, role, status, page]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (u: AdminUser) => {
    setEditing(u.id);
    setEditRole(u.role);
    setEditStatus(u.status);
  };

  const saveEdit = async (id: string) => {
    try {
      await adminUsers.update(id, { role: editRole, status: editStatus });
      toast.success('تم تحديث المستخدم');
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const deleteUser = async (u: AdminUser) => {
    if (!confirm(`حذف المستخدم ${u.email}؟`)) return;
    try {
      await adminUsers.destroy(u.id);
      toast.success('تم حذف المستخدم');
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900 font-kufi">إدارة المستخدمين</h1>
        <button onClick={load} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600">
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="بحث بالاسم أو البريد..."
            className="w-full pr-9 pl-3 py-2 text-sm border border-slate-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={role}
          onChange={e => { setRole(e.target.value); setPage(1); }}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">كل الأدوار</option>
          {ROLES.filter(Boolean).map(r => (
            <option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">كل الحالات</option>
          {STATUSES.filter(Boolean).map(s => (
            <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data?.data.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <User className="w-5 h-5" />
            <p className="text-sm">لا يوجد مستخدمون</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">المستخدم</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">الدور</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">الحالة</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">التسجيل</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.data.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center
                                        justify-center text-sm font-bold shrink-0">
                          {(u.full_name ?? u.email)[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{u.full_name ?? '—'}</p>
                          <p className="text-xs text-slate-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {editing === u.id ? (
                        <select
                          value={editRole}
                          onChange={e => setEditRole(e.target.value)}
                          className="text-xs border border-slate-200 rounded px-2 py-1
                                     focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {ROLES.filter(Boolean).map(r => (
                            <option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                          {u.role === 'admin' || u.role === 'moderator'
                            ? <ShieldCheck className="w-3 h-3" />
                            : <User className="w-3 h-3" />}
                          {ROLE_LABEL[u.role] ?? u.role}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {editing === u.id ? (
                        <select
                          value={editStatus}
                          onChange={e => setEditStatus(e.target.value)}
                          className="text-xs border border-slate-200 rounded px-2 py-1
                                     focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {STATUSES.filter(Boolean).map(s => (
                            <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[u.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {u.status === 'active'
                            ? <CheckCircle className="w-3 h-3" />
                            : <Ban className="w-3 h-3" />}
                          {STATUS_LABEL[u.status] ?? u.status}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center text-xs text-slate-400">
                      {new Date(u.created_at).toLocaleDateString('ar-MA')}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {editing === u.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => saveEdit(u.id)}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
                          >
                            حفظ
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="text-xs text-slate-500 hover:text-slate-700"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => startEdit(u)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            تعديل
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => deleteUser(u)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500">
              {data.from}–{data.to} من {data.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-600">{page} / {data.last_page}</span>
              <button
                onClick={() => setPage(p => Math.min(data.last_page, p + 1))}
                disabled={page === data.last_page}
                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
