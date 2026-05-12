'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { adminArticles, AdminArticle, adminCodes, AdminCode, adminNotes, AdminNote } from '@/lib/adminApi';
import { PaginatedResponse } from '@/lib/api';
import {
  Search, ChevronLeft, ChevronRight, RefreshCw,
  FileText, Pencil, Trash2, X, CheckSquare, Square, ChevronDown,
  StickyNote, Send, Loader2, Plus, Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';

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

export default function AdminArticlesPage() {
  const [data, setData]           = useState<PaginatedResponse<AdminArticle> | null>(null);
  const [loading, setLoading]     = useState(true);
  const [q, setQ]                 = useState('');
  const [code, setCode]           = useState('');
  const [status, setStatus]       = useState('');
  const [page, setPage]           = useState(1);
  const [allCodes, setAllCodes]   = useState<AdminCode[]>([]);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [editId, setEditId]       = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [codeSearch, setCodeSearch] = useState('');
  const [codeDropOpen, setCodeDropOpen] = useState(false);
  const codeDropRef = useRef<HTMLDivElement>(null);

  // delete confirmation state
  type DeleteTarget =
    | { kind: 'single'; article: AdminArticle }
    | { kind: 'bulk'; count: number; ids: string[] };
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // create article form state
  const [showCreate, setShowCreate]     = useState(false);
  const [createForm, setCreateForm]     = useState({ number: '', content_ar: '', content_fr: '', status: 'in_force', code_id: '' });
  const [createSaving, setCreateSaving] = useState(false);

  // notes panel state
  const [notesArticle, setNotesArticle]   = useState<AdminArticle | null>(null);
  const [notesList, setNotesList]         = useState<AdminNote[]>([]);
  const [notesLoading, setNotesLoading]   = useState(false);
  const [noteText, setNoteText]           = useState('');
  const [noteSaving, setNoteSaving]       = useState(false);

  useEffect(() => {
    // load all codes for the combobox — fetch multiple pages if needed
    const loadAllCodes = async () => {
      try {
        const first = await adminCodes.list({ page: 1 });
        let codes = first.data;
        for (let p = 2; p <= first.last_page; p++) {
          const next = await adminCodes.list({ page: p });
          codes = codes.concat(next.data);
        }
        setAllCodes(codes);
      } catch {}
    };
    loadAllCodes();
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setSelected(new Set());
    adminArticles.list({ q: q || undefined, code: code || undefined, status: status || undefined, page })
      .then(setData)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [q, code, status, page]);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!data) return;
    if (selected.size === data.data.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.data.map(a => a.id)));
    }
  };

  const handleBulk = async () => {
    if (!bulkStatus || selected.size === 0) return;
    try {
      await adminArticles.bulkUpdateStatus(Array.from(selected), bulkStatus);
      toast.success(`تم تحديث ${selected.size} مادة`);
      setSelected(new Set());
      setBulkStatus('');
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleBulkDelete = () => {
    setDeleteTarget({ kind: 'bulk', count: selected.size, ids: Array.from(selected) });
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (codeDropRef.current && !codeDropRef.current.contains(e.target as Node)) {
        setCodeDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const saveEditStatus = async (id: string) => {
    try {
      await adminArticles.update(id, { status: editStatus });
      toast.success('تم تحديث الحالة');
      setEditId(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const deleteArticle = (a: AdminArticle) => {
    setDeleteTarget({ kind: 'single', article: a });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'single') {
      await adminArticles.destroy(deleteTarget.article.id);
      toast.success('تم حذف الفصل');
    } else {
      const r = await adminArticles.bulkDestroy(deleteTarget.ids);
      toast.success(r.message);
      setSelected(new Set());
    }
    setDeleteTarget(null);
    load();
  };

  const openNotes = async (a: AdminArticle) => {
    setNotesArticle(a);
    setNoteText('');
    setNotesLoading(true);
    try {
      const list = await adminNotes.list(a.id);
      setNotesList(list);
    } catch { setNotesList([]); }
    finally { setNotesLoading(false); }
  };

  const submitNote = async () => {
    if (!notesArticle || !noteText.trim()) return;
    setNoteSaving(true);
    try {
      const r = await adminNotes.create(notesArticle.id, noteText.trim());
      setNotesList(prev => [r.note, ...prev]);
      setNoteText('');
      toast.success('تمت إضافة الملاحظة');
    } catch (e: any) { toast.error(e.message); }
    finally { setNoteSaving(false); }
  };

  const deleteNote = async (noteId: string) => {
    try {
      await adminNotes.destroy(noteId);
      setNotesList(prev => prev.filter(n => n.id !== noteId));
    } catch (e: any) { toast.error(e.message); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.code_id) { toast.error('اختر القانون أولاً'); return; }
    setCreateSaving(true);
    try {
      const r = await adminArticles.create({
        code_id:    createForm.code_id,
        number:     createForm.number.trim(),
        content_ar: createForm.content_ar.trim(),
        content_fr: createForm.content_fr.trim() || undefined,
        status:     createForm.status,
      });
      toast.success(r.message);
      setShowCreate(false);
      setCreateForm({ number: '', content_ar: '', content_fr: '', status: 'in_force', code_id: createForm.code_id });
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreateSaving(false);
    }
  };

  const allSelected = data ? selected.size === data.data.length && data.data.length > 0 : false;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900 font-kufi">إدارة المواد القانونية</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
                       px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            إضافة مادة
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="رقم الفصل أو المحتوى..."
            className="w-full pr-9 pl-3 py-2 text-sm border border-slate-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Searchable code combobox */}
        <div ref={codeDropRef} className="relative">
          <button
            type="button"
            onClick={() => setCodeDropOpen(o => !o)}
            className="flex items-center gap-2 text-sm border border-slate-200 rounded-lg px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[180px]
                       hover:border-slate-300"
          >
            <span className="flex-1 text-right truncate">
              {code ? allCodes.find(c => c.slug === code)?.title_ar ?? code : 'كل القوانين'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </button>

          {codeDropOpen && (
            <div className="absolute top-full mt-1 right-0 z-50 w-72 bg-white border border-slate-200
                            rounded-xl shadow-lg overflow-hidden">
              {/* Search inside dropdown */}
              <div className="p-2 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    autoFocus
                    value={codeSearch}
                    onChange={e => setCodeSearch(e.target.value)}
                    placeholder="بحث في القوانين..."
                    className="w-full pr-8 pl-3 py-1.5 text-sm border border-slate-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <ul className="max-h-56 overflow-y-auto">
                <li>
                  <button
                    onClick={() => { setCode(''); setPage(1); setCodeDropOpen(false); setCodeSearch(''); }}
                    className={`w-full text-right px-3 py-2 text-sm hover:bg-slate-50
                                ${code === '' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
                  >
                    كل القوانين
                  </button>
                </li>
                {allCodes
                  .filter(c => !codeSearch || c.title_ar.includes(codeSearch))
                  .map(c => (
                    <li key={c.id}>
                      <button
                        onClick={() => { setCode(c.slug); setPage(1); setCodeDropOpen(false); setCodeSearch(''); }}
                        className={`w-full text-right px-3 py-2 text-sm hover:bg-slate-50
                                    ${code === c.slug ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
                      >
                        {c.title_ar}
                      </button>
                    </li>
                  ))}
                {allCodes.filter(c => !codeSearch || c.title_ar.includes(codeSearch)).length === 0 && (
                  <li className="px-3 py-4 text-sm text-slate-400 text-center">لا توجد نتائج</li>
                )}
              </ul>
            </div>
          )}
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
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-blue-800">
            {selected.size} مادة محددة
          </span>
          <select
            value={bulkStatus}
            onChange={e => setBulkStatus(e.target.value)}
            className="text-sm border border-blue-300 rounded-lg px-3 py-1.5
                       focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">تغيير الحالة إلى...</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <button
            onClick={handleBulk}
            disabled={!bulkStatus}
            className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg
                       hover:bg-blue-700 disabled:opacity-40"
          >
            تطبيق
          </button>
          <div className="h-5 w-px bg-blue-200 mx-1" />
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 bg-red-600 text-white text-sm px-4 py-1.5
                       rounded-lg hover:bg-red-700"
          >
            <Trash2 className="w-3.5 h-3.5" />
            حذف المحدد
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-slate-500 hover:text-slate-700 mr-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data?.data.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <FileText className="w-5 h-5" />
            <p className="text-sm">لا توجد مواد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3 text-center w-10">
                    <button onClick={toggleAll} className="text-slate-400 hover:text-blue-600">
                      {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">المادة</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">القانون</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">الحالة</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">المشاهدات</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.data.map(a => (
                  <tr key={a.id} className={`hover:bg-slate-50 ${selected.has(a.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => toggleSelect(a.id)}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        {selected.has(a.id)
                          ? <CheckSquare className="w-4 h-4 text-blue-600" />
                          : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900">الفصل {a.number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">
                        {a.code?.title_ar ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editId === a.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <select
                            value={editStatus}
                            onChange={e => setEditStatus(e.target.value)}
                            className="text-xs border border-slate-200 rounded px-1.5 py-1
                                       focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {STATUSES.map(s => (
                              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => saveEditStatus(a.id)}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="text-xs text-slate-400"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditId(a.id); setEditStatus(a.status); }}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5
                                      rounded-full font-medium cursor-pointer hover:opacity-80
                                      ${STATUS_COLOR[a.status] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {STATUS_LABEL[a.status] ?? a.status}
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-500">
                      {a.view_count.toLocaleString('ar-MA')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openNotes(a)}
                          className="text-amber-500 hover:text-amber-700"
                          title="ملاحظات الإدارة"
                        >
                          <StickyNote className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteArticle(a)}
                          className="text-red-500 hover:text-red-700"
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
            <p className="text-xs text-slate-500">{data.from}–{data.to} من {data.total.toLocaleString('ar-MA')}</p>
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
      {/* Notes panel */}
      {notesArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 shrink-0">
              <StickyNote className="w-5 h-5 text-amber-500" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  ملاحظات الإدارة
                </h3>
                <p className="text-xs text-slate-500">الفصل {notesArticle.number}</p>
              </div>
              <button onClick={() => setNotesArticle(null)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            {/* Notes list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {notesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : notesList.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  لا توجد ملاحظات بعد
                </p>
              ) : (
                notesList.map(n => (
                  <div key={n.id} className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 group">
                    <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{n.content_ar}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-amber-600">
                        {n.author?.full_name ?? '—'}
                      </span>
                      <button
                        onClick={() => deleteNote(n.id)}
                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add note form */}
            <div className="px-4 pb-4 pt-3 border-t border-slate-100 shrink-0">
              <div className="flex gap-2">
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="أضف ملاحظة للإدارة على هذا الفصل..."
                  rows={2}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl resize-none
                             focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  onClick={submitNote}
                  disabled={noteSaving || !noteText.trim()}
                  className="px-3 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600
                             disabled:opacity-50 shrink-0"
                >
                  {noteSaving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create article modal ─────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">إضافة مادة قانونية جديدة</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  المواد المفقودة في مدونة الأسرة: 258–276 و 373–395
                </p>
              </div>
              <button onClick={() => setShowCreate(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Code selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  القانون <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={createForm.code_id}
                  onChange={e => setCreateForm(f => ({ ...f, code_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر القانون...</option>
                  {allCodes.map(c => (
                    <option key={c.id} value={c.id}>{c.title_ar}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    رقم المادة <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={createForm.number}
                    onChange={e => setCreateForm(f => ({ ...f, number: e.target.value }))}
                    placeholder="مثال: 258"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir="ltr"
                  />
                </div>
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">الحالة</label>
                  <select
                    value={createForm.status}
                    onChange={e => setCreateForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
              </div>

              {/* Content AR */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  النص بالعربية <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={8}
                  value={createForm.content_ar}
                  onChange={e => setCreateForm(f => ({ ...f, content_ar: e.target.value }))}
                  placeholder="أدخل نص المادة القانونية بالعربية..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl resize-none
                             focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              {/* Content FR */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  النص بالفرنسية <span className="text-slate-400 font-normal">(اختياري)</span>
                </label>
                <textarea
                  rows={4}
                  value={createForm.content_fr}
                  onChange={e => setCreateForm(f => ({ ...f, content_fr: e.target.value }))}
                  placeholder="Version française (optionnel)"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl resize-none
                             focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  dir="ltr"
                />
              </div>

              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white border-t border-slate-100 pb-1 -mx-6 px-6">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">
                  إلغاء
                </button>
                <button type="submit" disabled={createSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm
                             text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl font-medium">
                  {createSaving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Save className="w-4 h-4" />}
                  حفظ المادة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title={
            deleteTarget.kind === 'single'
              ? `حذف الفصل ${deleteTarget.article.number}`
              : `حذف ${deleteTarget.count} فصل`
          }
          warning={
            deleteTarget.kind === 'bulk'
              ? `سيتم حذف ${deleteTarget.count} فصل بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.`
              : 'سيتم حذف هذا الفصل بشكل نهائي.'
          }
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
