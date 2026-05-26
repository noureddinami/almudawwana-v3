'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { adminCodes, AdminCode, adminCodeTypes, CodeType } from '@/lib/adminApi';
import { PaginatedResponse } from '@/lib/api';
import {
  Search, ChevronLeft, ChevronRight, RefreshCw, Plus,
  BookOpen, Pencil, Trash2, X, CheckCircle, Upload, ExternalLink,
  ChevronsUpDown, ChevronUp, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { sendPushNotification } from '@/lib/pushNotification';

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
  source_url: string; slug: string;
  meta_description: string; keywords: string;
};
const emptyForm: FormState = {
  title_ar: '', title_fr: '', type: 'code',
  official_number: '', promulgation_date: '', status: 'in_force',
  source_url: '', slug: '',
  meta_description: '', keywords: '',
};

/** Generate a slug from text: lowercase, spaces→hyphens, keep Arabic chars.
 *  Do NOT use normalize('NFD') — it breaks Arabic hamza letters (ئ, أ, إ, ؤ) */
function autoSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    // Remove Arabic tashkeel/diacritics only (U+064B to U+065F range)
    .replace(/[ً-ٟ]/g, '')
    .replace(/[^a-z0-9ء-ي]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || '';
}

type SortKey = 'title_ar' | 'type' | 'article_count' | 'status' | 'created_at';
type SortDir = 'asc' | 'desc';

function SortableTh({
  label, sortKey, current, dir, onSort,
}: {
  label: string; sortKey: SortKey;
  current: SortKey | null; dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th
      className="px-4 py-3 text-center font-medium text-slate-600 cursor-pointer select-none hover:bg-slate-100 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center justify-center gap-1">
        {label}
        {active
          ? (dir === 'asc'
              ? <ChevronUp className="w-3 h-3 text-blue-600" />
              : <ChevronDown className="w-3 h-3 text-blue-600" />)
          : <ChevronsUpDown className="w-3 h-3 text-slate-300" />}
      </span>
    </th>
  );
}

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
  const [codeTypes, setCodeTypes] = useState<CodeType[]>([]);
  const [sortKey, setSortKey]     = useState<SortKey | null>(null);
  const [sortDir, setSortDir]     = useState<SortDir>('asc');

  // fetch code types once on mount
  useEffect(() => {
    adminCodeTypes.list()
      .then(types => {
        setCodeTypes(types);
        // set default type to first in list if available
        setForm(f => ({ ...f, type: f.type || types[0]?.slug || 'code' }));
      })
      .catch(() => { /* silently fallback to empty */ });
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    adminCodes.list({ q: q || undefined, status: status || undefined, page })
      .then(setData)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [q, status, page]);

  useEffect(() => { load(); }, [load]);

  /** Returns label for a type slug, using fetched types or slug as fallback */
  const typeLabel = (slug: string) =>
    codeTypes.find(t => t.slug === slug)?.name_ar ?? slug;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedRows = useMemo(() => {
    const rows = [...(data?.data ?? [])];
    if (!sortKey) return rows;
    return rows.sort((a, b) => {
      let av: any, bv: any;
      if (sortKey === 'title_ar')    { av = a.title_ar ?? ''; bv = b.title_ar ?? ''; }
      else if (sortKey === 'type')         { av = typeLabel(a.type); bv = typeLabel(b.type); }
      else if (sortKey === 'article_count'){ av = a.article_count ?? 0; bv = b.article_count ?? 0; }
      else if (sortKey === 'status')       { av = a.status ?? ''; bv = b.status ?? ''; }
      else if (sortKey === 'created_at')   { av = a.created_at ?? ''; bv = b.created_at ?? ''; }
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv), 'ar')
        : String(bv).localeCompare(String(av), 'ar');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sortKey, sortDir, codeTypes]);

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
      slug: c.slug ?? '',
      meta_description: c.meta_description ?? '',
      keywords: (c.keywords ?? []).join(', '),
    });
    setModal('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const keywordsArr = form.keywords
        ? form.keywords.split(',').map(k => k.trim()).filter(Boolean)
        : [];
      const payload = {
        title_ar: form.title_ar,
        title_fr: form.title_fr || undefined,
        type: form.type,
        official_number: form.official_number || undefined,
        promulgation_date: form.promulgation_date || undefined,
        status: form.status,
        source_url: form.source_url || null,
        slug: form.slug || undefined,
        meta_description: form.meta_description || null,
        keywords: keywordsArr.length ? keywordsArr : null,
      };
      if (modal === 'create') {
        await adminCodes.create(payload);
        toast.success('تم إنشاء القانون');
        sendPushNotification({
          title: '📚 نص قانوني جديد',
          body: `تمت إضافة "${form.title_ar}" إلى المدوّنة`,
          url: `/codes/${form.slug || autoSlug(form.title_ar)}`,
        });
      } else if (editing) {
        await adminCodes.update(editing.id, payload);
        toast.success('تم تحديث القانون');
        sendPushNotification({
          title: '📝 تحديث نص قانوني',
          body: `تم تحديث "${form.title_ar}"`,
          url: `/codes/${form.slug || editing.slug}`,
        });
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
                  <th
                    className="px-4 py-3 text-right font-medium text-slate-600 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('title_ar')}
                  >
                    <span className="inline-flex items-center gap-1">
                      العنوان
                      {sortKey === 'title_ar'
                        ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />)
                        : <ChevronsUpDown className="w-3 h-3 text-slate-300" />}
                    </span>
                  </th>
                  <SortableTh label="النوع" sortKey="type" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortableTh label="المواد" sortKey="article_count" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortableTh label="الحالة" sortKey="status" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortableTh label="تاريخ الإضافة" sortKey="created_at" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-center font-medium text-slate-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRows.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{c.title_ar}</p>
                      {c.title_fr && (
                        <p className="text-xs text-slate-400" dir="ltr">{c.title_fr}</p>
                      )}
                      {c.slug && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5" dir="ltr">/{c.slug}</p>
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
                        {typeLabel(c.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-slate-700">
                      {(c.article_count ?? 0).toLocaleString('ar-MA')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5
                                        rounded-full font-medium ${STATUS_COLOR[c.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {c.status === 'in_force' && <CheckCircle className="w-3 h-3" />}
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-500 whitespace-nowrap" dir="ltr">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
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
            (deleteTarget.article_count ?? 0) > 0
              ? `سيتم حذف ${deleteTarget.article_count} مادة مرتبطة بهذا القانون بشكل نهائي.`
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
                  onChange={e => {
                    const title = e.target.value;
                    const autoKeywords = title
                      .split(/\s+/)
                      .map(w => w.replace(/[ً-ٟ]/g, '').trim())
                      .filter(Boolean)
                      .join(', ');
                    setForm(f => ({
                      ...f,
                      title_ar: title,
                      slug: autoSlug(f.title_fr || title),
                      keywords: autoKeywords,
                    }));
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">العنوان بالفرنسية</label>
                <input
                  dir="ltr"
                  value={form.title_fr}
                  onChange={e => {
                    const titleFr = e.target.value;
                    setForm(f => ({
                      ...f,
                      title_fr: titleFr,
                      // Re-generate slug from French title if provided
                      slug: autoSlug(titleFr || f.title_ar),
                    }));
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Auto-generated slug */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Slug <span className="text-slate-400 font-normal text-xs">(يُولّد تلقائياً)</span>
                </label>
                <input
                  dir="ltr"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.replace(/\s+/g, '-').toLowerCase() }))}
                  placeholder="auto-generated-slug"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                             bg-slate-50 font-mono text-slate-600
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-400">
                  يُستخدم في الرابط. يُولّد تلقائياً من العنوان — يمكنك تعديله يدوياً.
                </p>
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
                    {codeTypes.length > 0
                      ? codeTypes.map(t => (
                          <option key={t.id} value={t.slug}>{t.name_ar}</option>
                        ))
                      : <option value={form.type}>{form.type}</option>
                    }
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

              {/* ── SEO ────────────────────────────────────────── */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">SEO — محركات البحث</p>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-slate-700">وصف الصفحة (meta description)</label>
                    <span className={`text-xs ${form.meta_description.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>
                      {form.meta_description.length}/160
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={form.meta_description}
                    onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                    placeholder="وصف مختصر يظهر في نتائج Google (120–160 حرف)..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    الكلمات المفتاحية
                    <span className="text-slate-400 font-normal mr-1 text-xs">(مفصولة بفواصل)</span>
                  </label>
                  <input
                    value={form.keywords}
                    onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                    placeholder="مدونة الأسرة, code famille, طلاق, زواج, نفقة"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-slate-400">أضف المصطلحات العربية والفرنسية — كل كلمة مفصولة بفاصلة</p>
                </div>
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
