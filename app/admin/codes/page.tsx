'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminCodes, AdminCode } from '@/lib/adminApi';
import { PaginatedResponse } from '@/lib/api';
import {
  Search, ChevronLeft, ChevronRight, RefreshCw, Plus,
  BookOpen, Pencil, Trash2, X, CheckCircle, Upload, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';

const TYPES = [
  'constitution','organic_law','ordinary_law','code',
  'decree_law','decree','order','circular','international_treaty',
];
const TYPE_LABEL: Record<string, string> = {
  constitution: 'دستور', organic_law: 'قانون تنظيمي', ordinary_law: 'قانون عادي',
  code: 'مدونة', decree_law: 'قانون-مرسوم', decree: 'مرسوم',
  order: 'قرار', circular: 'منشور', international_treaty: 'معاهدة دولية',
};
const STATUSES = ['in_force','abrogated','amended','draft'];
const STATUS_LABEL: Record<string, string> = {
  in_force: 'ساري', abrogated: 'ملغى', amended: 'معدَّل', draft: 'مسودة',
};
const STATUS_COLOR: Record<string, string> = {
  in_force:  'bg-emerald-100 text-emerald-700',
  abrogated: 'bg-red-100 text-red-700',
  amended:   'bg-amber-100 text-amber-700',
  draft:     'bg-slate-100 text-slate-600',
};

type FormState = {
  title_ar: string; title_fr: string; type: string;
  official_number: string; promulgation_date: string; status: string;
  source_url: string;
};
const emptyForm: FormState = {
  title_ar: '', title_fr: '', type: 'code',
  official_number: '', promulgation_date: '', status: 'in_force',
  source_url: '',
};

export default function AdminCodesPage() {
  const router = useRouter();
  const [data, setData]           = useState<PaginatedResponse<AdminCode> | null>(null);
  const [loading, setLoading]     = useState(true);
  const [q, setQ]                 = useState('');
  const [status, setStatus]       = useState('');
  const [page, setPage]           = useState(1);
  const [modal, setModal]         = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing]     = useState<AdminCode | null>(null);
  const [form, setForm]           = useState<FormState>(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminCode | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminCodes.list({ q: q || undefined, status: status || undefined, page })
      .then(setData)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [q, status, page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModal('create');
  };
  const openEdit = (c: AdminCode) => {
    setEditing(c);
    setForm({
      title_ar: c.title_ar, title_fr: c.title_fr ?? '',
      type: c.type, official_number: c.official_number ?? '',
      promulgation_date: c.promulgation_date?.slice(0, 10) ?? '',
      status: c.status,
      source_url: (c as any).source_url ?? '',
    });
    setModal('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title_ar: form.title_ar,
        title_fr: form.title_fr || undefined,
        type: form.type,
        official_number: form.official_number || undefined,
        promulgation_date: form.promulgation_date || undefined,
        status: form.status,
        source_url: form.source_url || null,
      };
      if (modal === 'create') {
        await adminCodes.create(payload);
        toast.success('تم إنشاء القانون');
      } else if (editing) {
        await adminCodes.update(editing.id, payload);
        toast.success('تم تحديث القانون');
      }
      setModal(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteCode = async (c: AdminCode) => {
    setDeleteTarget(c);
  };

  const confirmDeleteCode = async () => {
    if (!deleteTarget) return;
    const r = await adminCodes.destroy(deleteTarget.id);
    toast.success(r.message ?? 'تم حذف القانون');
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900 font-kufi">إدارة القوانين</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2
                     rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          إضافة قانون
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="بحث بالعنوان..."
            className="w-full pr-9 pl-3 py-2 text-sm border border-slate-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">كل الحالات</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data?.data.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <BookOpen className="w-5 h-5" />
            <p className="text-sm">لا توجد قوانين</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">العنوان</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">النوع</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">المواد</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">الحالة</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.data.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{c.title_ar}</p>
                      {c.title_fr && (
                        <p className="text-xs text-slate-400" dir="ltr">{c.title_fr}</p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        {c.official_number && (
                          <span className="text-xs text-slate-400">رقم {c.official_number}</span>
                        )}
                        {(c as any).source_url && (
                          <a
                            href={(c as any).source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-0.5 text-xs text-blue-500 hover:text-blue-700"
                            title={(c as any).source_url}
                          >
                            <ExternalLink className="w-3 h-3" />
                            رابط رسمي
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-slate-600">
                        {TYPE_LABEL[c.type] ?? c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-slate-700">
                      {c.total_articles.toLocaleString('ar-MA')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5
                                        rounded-full font-medium ${STATUS_COLOR[c.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {c.status === 'in_force' && <CheckCircle className="w-3 h-3" />}
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          تعديل
                        </button>
                        <button
                          onClick={() => router.push(`/admin/pdfs?code_id=${c.id}`)}
                          className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                          title="رفع PDF واستيراد مواده"
                        >
                          <Upload className="w-3 h-3" />
                          PDF
                        </button>
                        <button
                          onClick={() => deleteCode(c)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          title={`حذف "${deleteTarget.title_ar}"`}
          warning={
            deleteTarget.total_articles > 0
              ? `سيتم حذف ${deleteTarget.total_articles} مادة مرتبطة بهذا القانون بشكل نهائي.`
              : undefined
          }
          onConfirm={confirmDeleteCode}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {modal === 'create' ? 'إضافة قانون جديد' : 'تعديل القانون'}
              </h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">العنوان بالعربية *</label>
                <input
                  required
                  value={form.title_ar}
                  onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">العنوان بالفرنسية</label>
                <input
                  dir="ltr"
                  value={form.title_fr}
                  onChange={e => setForm(f => ({ ...f, title_fr: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">النوع *</label>
                  <select
                    required
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TYPES.map(t => (
                      <option key={t} value={t}>{TYPE_LABEL[t] ?? t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الرقم الرسمي</label>
                  <input
                    dir="ltr"
                    value={form.official_number}
                    onChange={e => setForm(f => ({ ...f, official_number: e.target.value }))}
                    placeholder="ex: 01-09"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الإصدار</label>
                  <input
                    type="date"
                    dir="ltr"
                    value={form.promulgation_date}
                    onChange={e => setForm(f => ({ ...f, promulgation_date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Source URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  رابط التحميل الرسمي
                  <span className="text-slate-400 font-normal mr-1 text-xs">(sgg.gov.ma، adala.justice.gov.ma…)</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    dir="ltr"
                    value={form.source_url}
                    onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))}
                    placeholder="https://adala.justice.gov.ma/..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-blue-500
                               placeholder:text-slate-300"
                  />
                  {form.source_url && (
                    <a
                      href={form.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700"
                      title="فتح الرابط"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  هذا الرابط يظهر للمستخدمين كزر «النص الرسمي» في صفحة القانون.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg
                             hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'جاري الحفظ...' : modal === 'create' ? 'إنشاء' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
