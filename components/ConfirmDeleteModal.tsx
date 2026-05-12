'use client';

import { useState, useEffect, useRef } from 'react';
import { Trash2, X, AlertTriangle, Eye, EyeOff, Lock } from 'lucide-react';
import { auth } from '@/lib/api';

interface Props {
  title: string;
  description?: string;
  warning?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  title, description, warning, onConfirm, onCancel,
}: Props) {
  const [password, setPassword]   = useState('');
  const [show, setShow]           = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // autofocus password field when modal opens
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCancel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setError('أدخل كلمة المرور'); return; }
    setLoading(true);
    setError('');
    try {
      await auth.verifyPassword(password);
      await onConfirm();
    } catch (err: any) {
      setError(err.message ?? 'خطأ غير متوقع');
      setPassword('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-slate-900">تأكيد الحذف</h2>
            <p className="text-sm text-slate-600 mt-0.5 truncate">{title}</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Description */}
          {description && (
            <p className="text-sm text-slate-600">{description}</p>
          )}

          {/* Warning */}
          {warning && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{warning}</p>
            </div>
          )}

          {/* Password field */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="أدخل كلمة مرورك للتأكيد"
                  dir="ltr"
                  className={`w-full pr-4 pl-10 py-2.5 text-sm border rounded-lg
                              focus:outline-none focus:ring-2 transition-colors
                              ${error
                                ? 'border-red-400 focus:ring-red-400 bg-red-50'
                                : 'border-slate-300 focus:ring-red-500 focus:border-transparent'}`}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <span className="text-red-500">✕</span> {error}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm text-slate-600 bg-slate-100
                           hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading || !password}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                           text-sm font-medium text-white bg-red-600 hover:bg-red-700
                           rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {loading ? 'جاري الحذف...' : 'تأكيد الحذف'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
