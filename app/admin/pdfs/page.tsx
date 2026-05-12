'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminPdfs, AdminPdf, adminCodes, AdminCode } from '@/lib/adminApi';
import { PaginatedResponse } from '@/lib/api';
import {
  Upload, FileText, Trash2, Play, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle, Clock, AlertCircle, Loader2, X, Info, Eye, Code2, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_LABEL: Record<string, string> = {
  pending:    'في الانتظار',
  processing: 'جاري الاستخراج',
  imported:   'مُستورد',
  failed:     'فشل',
};
const STATUS_COLOR: Record<string, string> = {
  pending:    'bg-slate-100 text-slate-600',
  processing: 'bg-blue-100 text-blue-700',
  imported:   'bg-emerald-100 text-emerald-700',
  failed:     'bg-red-100 text-red-700',
};
const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'imported')   return <CheckCircle className="w-3 h-3" />;
  if (status === 'processing') return <Loader2 className="w-3 h-3 animate-spin" />;
  if (status === 'failed')     return <AlertCircle className="w-3 h-3" />;
  return <Clock className="w-3 h-3" />;
};

type PreviewResult = {
  detected: number;
  sample: { type: string; number: string; content_ar: string }[];
  all_numbers: string[];
};

function AdminPdfsContent() {
  const searchParams    = useSearchParams();
  const prefilledCodeId = searchParams.get('code_id') ?? '';

  const [data, setData]         = useState<PaginatedResponse<AdminPdf> | null>(null);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [allCodes, setAllCodes] = useState<AdminCode[]>([]);
  const [showUpload, setShowUpload]   = useState(!!prefilledCodeId);
  const [showFormat, setShowFormat]   = useState(false);
  const [logPdf, setLogPdf]           = useState<AdminPdf | null>(null);
  const [previewPdf, setPreviewPdf]   = useState<{ pdf: AdminPdf; result: PreviewResult } | null>(null);
  const [extracting, setExtracting]   = useState<Set<string>>(new Set());
  const [previewing, setPreviewing]   = useState<Set<string>>(new Set());

  // Upload form
  const [file, setFile]           = useState<File | null>(null);
  const [codeId, setCodeId]       = useState(prefilledCodeId);
  const [titleAr, setTitleAr]     = useState('');
  const [docType, setDocType]     = useState('code');
  const [sourceUrl, setSourceUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isTextFile = (f: File | null) =>
    f ? /\.(md|txt)$/i.test(f.name) : false;

  useEffect(() => {
    adminCodes.list({ page: 1 }).then(r => setAllCodes(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (prefilledCodeId && allCodes.length > 0 && !titleAr) {
      const c = allCodes.find(c => c.id === prefilledCodeId);
      if (c) setTitleAr(c.title_ar);
    }
  }, [prefilledCodeId, allCodes, titleAr]);

  const load = useCallback(() => {
    setLoading(true);
    adminPdfs.list(page)
      .then(setData)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleCodeChange = (id: string) => {
    setCodeId(id);
    if (!titleAr && id) {
      const c = allCodes.find(c => c.id === id);
      if (c) setTitleAr(c.title_ar);
    }
  };

  const handlePreview = async (pdf: AdminPdf) => {
    setPreviewing(prev => new Set(prev).add(pdf.id));
    try {
      const result = await adminPdfs.preview(pdf.id);
      setPreviewPdf({ pdf, result });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPreviewing(prev => { const next = new Set(prev); next.delete(pdf.id); return next; });
    }
  };

  const openUpload = () => {
    setShowUpload(true);
  };

  const closeUpload = () => {
    setShowUpload(false);
    setFile(null);
    setTitleAr('');
    setSourceUrl('');
    if (!prefilledCodeId) setCodeId('');
    setDocType('code');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error('اختر ملف PDF أولاً'); return; }
    if (!titleAr.trim()) { toast.error('أدخل عنوان الوثيقة'); return; }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('title_ar', titleAr.trim());
    fd.append('document_type', docType);
    if (codeId)     fd.append('code_id', codeId);
    if (sourceUrl.trim()) fd.append('source_url', sourceUrl.trim());

    setUploading(true);
    try {
      const r = await adminPdfs.upload(fd);
      toast.success('تم رفع الملف بنجاح');
      closeUpload();
      load();
      if (codeId && confirm('هل تريد استخراج المواد من الملف الآن؟')) {
        handleExtract(r.pdf.id);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleExtract = async (id: string) => {
    setExtracting(prev => new Set(prev).add(id));
    try {
      const r = await adminPdfs.extract(id);
      toast.success(`تم استيراد ${r.articles_imported} مادة من ${r.articles_detected} مكتشفة`);
      load();
    } catch (e: any) {
      toast.error(e.message);
      load();
    } finally {
      setExtracting(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const handleDelete = async (pdf: AdminPdf) => {
    if (!confirm(`حذف "${pdf.title_ar}"؟`)) return;
    try {
      await adminPdfs.destroy(pdf.id);
      toast.success('تم الحذف');
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900 font-kufi">استيراد PDF</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="text-sm text-slate-500 hover:text-blue-600">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openUpload}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2
                       rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Upload className="w-4 h-4" />
            رفع ملف PDF
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="flex-1 text-sm text-blue-800 space-y-1">
          <p className="font-medium">الصيغ المدعومة للاستيراد</p>
          <ul className="space-y-0.5 text-blue-700">
            <li><span className="font-mono bg-blue-100 px-1 rounded">.md / .txt</span> — نص عربي مباشر (الأكثر موثوقية)</li>
            <li><span className="font-mono bg-blue-100 px-1 rounded">.pdf</span> — يستخدم <span className="font-mono">pdftotext</span> إن توفّر، وإلا استخراج تلقائي</li>
          </ul>
          <button
            onClick={() => setShowFormat(true)}
            className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            <Code2 className="w-3 h-3" />
            عرض تنسيق ملف .md المتوقع
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data?.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
            <FileText className="w-10 h-10" />
            <p className="text-sm">لم يتم رفع أي ملف بعد</p>
            <button onClick={openUpload} className="text-sm text-blue-600 hover:underline">
              رفع أول ملف PDF
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">الملف</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">القانون</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">الحجم</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">الحالة</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">المواد</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">رابط رسمي</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.data.map(pdf => (
                  <tr key={pdf.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 leading-snug">{pdf.title_ar}</p>
                      <p className="text-xs text-slate-400" dir="ltr">{pdf.original_filename}</p>
                    </td>
                    <td className="px-4 py-3">
                      {pdf.code?.title_ar
                        ? <span className="text-xs text-slate-600">{pdf.code.title_ar}</span>
                        : <span className="text-xs text-amber-600">غير مرتبط</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-500" dir="ltr">
                      {formatSize(pdf.file_size)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setLogPdf(pdf)}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1
                                    rounded-full font-medium cursor-pointer hover:opacity-80
                                    ${STATUS_COLOR[pdf.status]}`}
                      >
                        <StatusIcon status={pdf.status} />
                        {STATUS_LABEL[pdf.status] ?? pdf.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-slate-700">
                      {pdf.articles_extracted != null
                        ? pdf.articles_extracted.toLocaleString('ar-MA')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {pdf.source_url ? (
                        <a
                          href={pdf.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                          title={pdf.source_url}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          رابط
                        </a>
                      ) : (
                        <span className="text-xs text-amber-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {/* Preview dry-run */}
                        {pdf.code_id && (
                          <button
                            onClick={() => handlePreview(pdf)}
                            disabled={previewing.has(pdf.id)}
                            title="معاينة المواد المكتشفة (بدون حفظ)"
                            className="flex items-center gap-1 text-xs text-slate-500
                                       hover:text-blue-600 disabled:opacity-40"
                          >
                            {previewing.has(pdf.id)
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        {/* Extract */}
                        {pdf.code_id && pdf.status !== 'imported' && (
                          <button
                            onClick={() => handleExtract(pdf.id)}
                            disabled={extracting.has(pdf.id) || pdf.status === 'processing'}
                            className="flex items-center gap-1 text-xs bg-emerald-600 text-white
                                       px-3 py-1.5 rounded-lg hover:bg-emerald-700
                                       disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {extracting.has(pdf.id)
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Play className="w-3 h-3" />}
                            استخراج
                          </button>
                        )}
                        {/* Re-extract */}
                        {pdf.code_id && pdf.status === 'imported' && (
                          <button
                            onClick={() => handleExtract(pdf.id)}
                            disabled={extracting.has(pdf.id)}
                            title="إعادة الاستخراج (تجاهل المكررات)"
                            className="text-slate-400 hover:text-blue-600 disabled:opacity-40"
                          >
                            {extracting.has(pdf.id)
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <RefreshCw className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(pdf)}
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

      {/* ── Upload Modal ─────────────────────────────────────────── */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">رفع ملف (PDF / MD / TXT)</h2>
              <button onClick={closeUpload} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 cursor-pointer text-center
                            transition-colors hover:border-blue-400 hover:bg-blue-50
                            ${file ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}
              >
                {file ? (
                  <div className="space-y-1">
                    <FileText className={`w-8 h-8 mx-auto ${isTextFile(file) ? 'text-emerald-600' : 'text-blue-600'}`} />
                    <p className="text-sm font-medium text-slate-800" dir="ltr">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                    {isTextFile(file) && (
                      <p className="text-xs text-emerald-700 font-medium">✓ نص عربي — استخراج موثوق</p>
                    )}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileRef.current) fileRef.current.value = '';
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      إزالة الملف
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm text-slate-600">انقر لاختيار ملف</p>
                    <p className="text-xs text-slate-400">
                      <span className="font-mono">.pdf</span> — <span className="font-mono">.md</span> — <span className="font-mono">.txt</span> — الحد الأقصى 50 MB
                    </p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,.md,.txt,text/plain,text/markdown"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                    if (f && !titleAr) setTitleAr(f.name.replace(/\.(pdf|md|txt)$/i, ''));
                  }}
                />
              </div>

              {/* ─── Section A : ملف الاستخراج الداخلي ─────────────── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <span className="flex-1 border-t border-slate-200" />
                  <span>ملف الاستخراج (داخلي)</span>
                  <span className="flex-1 border-t border-slate-200" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    القانون المرتبط
                    <span className="text-slate-400 font-normal mr-1">(مطلوب للاستخراج)</span>
                  </label>
                  <select
                    value={codeId}
                    onChange={e => handleCodeChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— بدون ربط (يمكن تحديده لاحقاً) —</option>
                    {allCodes.map(c => (
                      <option key={c.id} value={c.id}>{c.title_ar}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">عنوان الوثيقة *</label>
                  <input
                    required
                    value={titleAr}
                    onChange={e => setTitleAr(e.target.value)}
                    placeholder="مثال: مدونة الأسرة — النص الرسمي 2024"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">نوع الوثيقة</label>
                  <select
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[
                      ['code', 'مدونة'], ['law', 'قانون'], ['decree', 'مرسوم'],
                      ['order', 'قرار'], ['circular', 'منشور'], ['other', 'أخرى'],
                    ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>

                {!codeId && (
                  <div className="flex gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    بدون ربط بقانون لن يكون بالإمكان استخراج المواد مباشرة.
                  </div>
                )}
              </div>

              {/* ─── Section B : رابط التحميل الرسمي ────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <span className="flex-1 border-t border-slate-200" />
                  <span>رابط التحميل للمستخدمين</span>
                  <span className="flex-1 border-t border-slate-200" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    الرابط الرسمي
                    <span className="text-slate-400 font-normal mr-1">(sgg.gov.ma، adala.justice.gov.ma…)</span>
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    value={sourceUrl}
                    onChange={e => setSourceUrl(e.target.value)}
                    placeholder="https://adala.justice.gov.ma/..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-blue-500
                               placeholder:text-slate-300"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    هذا الرابط هو ما يراه المستخدمون لتحميل النص الرسمي — لا يُستخدم الملف المُرفَع للتحميل العام.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeUpload}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm
                             font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />جاري الرفع...</>
                    : <><Upload className="w-4 h-4" />رفع الملف</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Format Guide Modal ──────────────────────────────────── */}
      {showFormat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">تنسيق ملف .md / .txt للاستيراد</h2>
              </div>
              <button onClick={() => setShowFormat(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 text-sm">
              <p className="text-slate-600">
                يتعرّف النظام على أي سطر يبدأ بـ <span className="font-mono bg-slate-100 px-1 rounded">الفصل</span> / <span className="font-mono bg-slate-100 px-1 rounded">المادة</span> / <span className="font-mono bg-slate-100 px-1 rounded">البند</span> متبوعاً برقم كعنوان مادة. كل النص بعده يصبح محتوى المادة حتى العنوان التالي.
              </p>

              <div>
                <p className="font-medium text-slate-700 mb-2">مثال بسيط (أوصى به)</p>
                <pre className="bg-slate-900 text-emerald-300 rounded-xl p-4 text-xs leading-relaxed overflow-x-auto" dir="ltr">{`الفصل 1
يُعدّ كل شخص بريئاً حتى تثبت إدانته قانوناً.

الفصل 2
تضمن الدولة حق التقاضي للجميع.

الفصل 3
لا يجوز إلقاء القبض على أي شخص أو اعتقاله أو احتجازه إلا في الحالات
وبالكيفيات التي يحددها القانون.

الفصل 3 مكرر
يطبق هذا الفصل مع مراعاة أحكام الفصل السابق.`}</pre>
              </div>

              <div>
                <p className="font-medium text-slate-700 mb-2">صيغ العناوين المقبولة</p>
                <ul className="space-y-1 text-slate-600 font-mono text-xs">
                  {[
                    ['الفصل 1',         'عنوان بسيط'],
                    ['المادة 25',        'مادة'],
                    ['البند 3',          'بند'],
                    ['الفصل 35-1',       'فصل مركّب'],
                    ['الفصل 3 مكرر',    'فصل مكرر'],
                    ['## الفصل 1',      'عنوان Markdown'],
                    ['الفصل الأول',     'أرقام ترتيبية'],
                    ['المادة الأولى',   'أرقام ترتيبية'],
                  ].map(([ex, label]) => (
                    <li key={ex} className="flex items-center gap-3">
                      <span className="bg-slate-100 px-2 py-0.5 rounded w-44 shrink-0">{ex}</span>
                      <span className="text-slate-400 not-italic font-sans">{label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 space-y-1">
                <p className="font-medium">نصائح للتحويل من PDF</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>افتح الـ PDF في متصفح أو Adobe Reader → نسخ النص الكامل</li>
                  <li>ألصقه في VS Code أو Notepad++ → احفظ بصيغة UTF-8 بامتداد .txt</li>
                  <li>أزل رؤوس الصفحات وأرقامها (السطور التي تحتوي أرقاماً فقط تُتجاهل تلقائياً)</li>
                  <li>تأكد أن كل فصل يبدأ بـ «الفصل X» في سطر منفصل</li>
                </ul>
              </div>

              <div className="flex justify-end">
                <button onClick={() => setShowFormat(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ────────────────────────────────────────── */}
      {previewPdf && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <div>
                <h2 className="text-base font-bold text-slate-900">معاينة الاستخراج</h2>
                <p className="text-xs text-slate-400">{previewPdf.pdf.title_ar}</p>
              </div>
              <button onClick={() => setPreviewPdf(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                <span className="text-2xl font-bold text-blue-600">
                  {previewPdf.result.detected}
                </span>
                <span className="text-sm text-slate-600">مادة مكتشفة (معاينة — لم يتم الحفظ)</span>
              </div>

              {previewPdf.result.all_numbers.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">أرقام المواد المكتشفة</p>
                  <div className="flex flex-wrap gap-1.5">
                    {previewPdf.result.all_numbers.slice(0, 50).map(n => (
                      <span key={n} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono">
                        {n}
                      </span>
                    ))}
                    {previewPdf.result.all_numbers.length > 50 && (
                      <span className="text-xs text-slate-400">
                        + {previewPdf.result.all_numbers.length - 50} أخرى
                      </span>
                    )}
                  </div>
                </div>
              )}

              {previewPdf.result.sample.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">عينة (أول 5 مواد)</p>
                  <div className="space-y-3">
                    {previewPdf.result.sample.map(a => (
                      <div key={a.number} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <p className="text-xs font-bold text-blue-700 mb-1">{a.type} {a.number}</p>
                        <p className="text-xs text-slate-700 leading-relaxed font-amiri line-clamp-4">
                          {a.content_ar}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewPdf.result.detected === 0 && (
                <div className="flex gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">لم يتم اكتشاف أي مادة</p>
                    <p className="text-xs mt-0.5">تأكد أن الملف يحتوي على عناوين من نوع «الفصل X» أو «المادة X» في سطور منفصلة.</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                {previewPdf.result.detected > 0 && (
                  <button
                    onClick={() => {
                      handleExtract(previewPdf.pdf.id);
                      setPreviewPdf(null);
                    }}
                    className="flex items-center gap-2 bg-emerald-600 text-white text-sm
                               px-4 py-2 rounded-lg hover:bg-emerald-700"
                  >
                    <Play className="w-4 h-4" />
                    استخراج وحفظ ({previewPdf.result.detected} مادة)
                  </button>
                )}
                <button onClick={() => setPreviewPdf(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Log Modal ───────────────────────────────────────────── */}
      {logPdf && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">تفاصيل الاستخراج</h2>
                <p className="text-xs text-slate-400">{logPdf.title_ar}</p>
              </div>
              <button onClick={() => setLogPdf(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1
                                  rounded-full font-medium ${STATUS_COLOR[logPdf.status]}`}>
                  <StatusIcon status={logPdf.status} />
                  {STATUS_LABEL[logPdf.status]}
                </span>
                {logPdf.articles_extracted != null && (
                  <span className="text-sm text-slate-600">
                    {logPdf.articles_extracted} مادة مستوردة
                  </span>
                )}
              </div>
              {logPdf.extraction_log ? (
                <pre className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs
                                text-slate-700 whitespace-pre-wrap font-mono leading-relaxed" dir="ltr">
                  {logPdf.extraction_log}
                </pre>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">
                  {logPdf.status === 'pending' ? 'لم يبدأ الاستخراج بعد' : 'لا توجد سجلات'}
                </p>
              )}
              <div className="flex justify-end gap-3">
                {logPdf.status !== 'imported' && logPdf.code_id && (
                  <button
                    onClick={() => { handleExtract(logPdf.id); setLogPdf(null); }}
                    className="flex items-center gap-2 bg-emerald-600 text-white text-sm
                               px-4 py-2 rounded-lg hover:bg-emerald-700"
                  >
                    <Play className="w-4 h-4" />
                    استخراج الآن
                  </button>
                )}
                <button onClick={() => setLogPdf(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPdfsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AdminPdfsContent />
    </Suspense>
  );
}
