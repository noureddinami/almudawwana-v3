'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminCodeTypes, CodeType } from '@/lib/adminApi';
import { Plus, Pencil, Trash2, RefreshCw, Save, X, GripVertical, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';

const COLORS = [
  { key: 'blue',   label: 'أزرق',   cls: 'bg-blue-50   text-blue-700'   },
  { key: 'teal',   label: 'فيروزي', cls: 'bg-teal-50   text-teal-700'   },
  { key: 'violet', label: 'بنفسجي', cls: 'bg-violet-50 text-violet-700' },
  { key: 'amber',  label: 'ذهبي',   cls: 'bg-amber-50  text-amber-700'  },
  { key: 'green',  label: 'أخضر',   cls: 'bg-green-50  text-green-700'  },
  { key: 'red',    label: 'أحمر',   cls: 'bg-red-50    text-red-700'    },
  { key: 'slate',  label: 'رمادي',  cls: 'bg-slate-100 text-slate-600'  },
];

function colorCls(key: string) {
  return COLORS.find(c => c.key === key)?.cls ?? 'bg-slate-100 text-slate-600';
}

const EMPTY = { name_ar: '', name_fr: '', color: 'slate', sort_order: 0 };

export default function AdminCodeTypesPage() {
  const [types, setTypes]         = useState<CodeType[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<CodeType | null>(null);
  const [form, setForm]           = useState({ ...EMPTY });
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CodeType | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminCodeTypes.list()
      .then(setTypes)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, sort_order: (types.at(-1)?.sort_order ?? 0) + 1 });
    setShowForm(true);
  };

  const openEdit = (t: CodeType) => {
    setEditing(t);
    setForm({ name_ar: t.name_ar, name_fr: t.name_fr ?? '', color: t.color, sort_order: t.sort_order });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setForm({ ...EMPTY }); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const updated = await adminCodeTypes.update(editing.id, {
          name_ar: form.name_ar,
          name_fr: form.name_fr || undefined,
          color: form.color,
          sort_order: form.sort_order,
        });
        toast.success('تم التعديل');
        setTypes(ts => ts.map(t => t.id === updated.id ? updated : t));
      } else {
        const created = await adminCodeTypes.create({
          name_ar: form.name_ar,
          name_fr: form.name_fr || undefined,
          color: form.color,
          sort_order: form.sort_order,
        });
        toast.success('تمت الإضافة');
        setTypes(ts => [...ts, created].sort((a, b) => a.sort_order - b.sort_order));
      }
      closeForm();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await adminCodeTypes.destroy(deleteTarget.id);
    toast.success('تم الحذف');
    setTypes(ts => ts.filter(t => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-kufi">أنواع القوانين</h1>
          <p className="text-sm text-slate-500 mt-0.5">{types.length} نوع مُعرَّف</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
                       px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            إضافة نوع
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : types.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Tag className="w-10 h-10 opacity-30" />
            <p className="text-sm">لا توجد أنواع</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500 uppercase">
                <th className="px-4 py-3 text-right font-medium w-10">#</th>
                <th className="px-4 py-3 text-right font-medium">الاسم بالعربية</th>
                <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">الاسم بالفرنسية</th>
                <th className="px-4 py-3 text-right font-medium">الشارة</th>
                <th className="px-4 py-3 text-right font-medium hidden md:table-cell">الترتيب</th>
                <th className="px-4 py-3 text-right font-medium hidden md:table-cell">عدد القوانين</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {types.map((t, i) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{t.name_ar}</td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell" dir="ltr">{t.name_fr ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colorCls(t.color)}`}>
                      {t.name_ar}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{t.sort_order}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      (t.codes_count ?? 0) > 0
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {t.codes_count ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(t)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(t)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        disabled={(t.codes_count ?? 0) > 0}
                        title={(t.codes_count ?? 0) > 0 ? 'لا يمكن الحذف — مرتبط بقوانين' : 'حذف'}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Color legend */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <p className="text-xs font-medium text-slate-500 mb-3">الألوان المتاحة</p>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <span key={c.key} className={`text-xs px-3 py-1 rounded-full font-medium ${c.cls}`}>
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editing ? 'تعديل النوع' : 'إضافة نوع جديد'}
              </h3>
              <button onClick={closeForm}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  الاسم بالعربية <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.name_ar}
                  onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: قانون تنظيمي"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  الاسم بالفرنسية
                </label>
                <input
                  value={form.name_fr}
                  onChange={e => setForm(f => ({ ...f, name_fr: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Loi organique"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  لون الشارة
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color: c.key }))}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${c.cls}
                                  ${form.color === c.key
                                    ? 'ring-2 ring-offset-1 ring-slate-400 scale-105'
                                    : 'opacity-70 hover:opacity-100'}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  الترتيب
                </label>
                <input
                  type="number" min={0}
                  value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: +e.target.value }))}
                  className="w-24 px-3 py-2 text-sm border border-slate-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Preview */}
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 mb-2">معاينة الشارة</p>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colorCls(form.color)}`}>
                  {form.name_ar || 'اسم النوع'}
                </span>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeForm}
                  className="flex-1 px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">
                  إلغاء
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm
                             text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl font-medium">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           : <Save className="w-4 h-4" />}
                  {editing ? 'حفظ التعديلات' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDeleteModal
          title="حذف نوع القانون"
          warning={`سيتم حذف النوع "${deleteTarget.name_ar}" نهائياً.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
