'use client';

import { useEffect, useState } from 'react';
import { articles as articlesApi, Comment } from '@/lib/api';
import { MessageSquare, Send, User, Clock, Loader2, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'الآن';
  if (m < 60)  return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `منذ ${d} يوم`;
  const mo = Math.floor(d / 30);
  return `منذ ${mo} شهر`;
}

interface Props {
  articleSlug: string;
  initialCount?: number;
}

export default function CommentsSection({ articleSlug, initialCount = 0 }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('mudawwana_token'));
    articlesApi.comments.list(articleSlug)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [articleSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await articlesApi.comments.create(articleSlug, text.trim());
      setText('');
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message ?? 'خطأ في الإرسال');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-8 space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <MessageSquare className="w-5 h-5 text-slate-500" />
        <h2 className="text-base font-bold text-slate-800">
          التعليقات
          {comments.length > 0 && (
            <span className="mr-2 text-sm font-normal text-slate-400">({comments.length})</span>
          )}
        </h2>
      </div>

      {/* Comment form */}
      {isLoggedIn ? (
        submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 text-center">
            ✅ تم إرسال تعليقك — سيظهر بعد مراجعته من قِبَل الإدارة.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="شاركنا ملاحظتك أو تعليقك على هذه المادة..."
              rows={3}
              maxLength={2000}
              className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl resize-none
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder:text-slate-400"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{text.length}/2000</span>
              <button
                type="submit"
                disabled={submitting || text.trim().length < 10}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm
                           font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
                إرسال التعليق
              </button>
            </div>
          </form>
        )
      ) : (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200
                        rounded-xl px-5 py-4">
          <p className="text-sm text-slate-600">سجّل دخولك لإضافة تعليق</p>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-800"
          >
            <LogIn className="w-4 h-4" />
            تسجيل الدخول
          </Link>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">
          لا توجد تعليقات بعد — كن أول من يعلّق!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {c.author?.full_name ?? 'مستخدم'}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 mr-auto">
                  <Clock className="w-3 h-3" />
                  {timeAgo(c.created_at)}
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {c.content_ar}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
