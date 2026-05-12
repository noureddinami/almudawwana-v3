'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveToken } from '@/lib/api';
import { Scale, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = params.get('token');
    const error = params.get('message');

    if (token) {
      saveToken(token);
      toast.success('تم تسجيل الدخول بنجاح');
      router.replace('/');
    } else {
      toast.error(error ?? 'فشل تسجيل الدخول بـ Google');
      router.replace('/login');
    }
  }, [params, router]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
        <Scale className="w-7 h-7 text-white" />
      </div>
      <div className="flex items-center gap-2 text-slate-600">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-sm">جاري تسجيل الدخول...</span>
      </div>
      <Suspense>
        <CallbackInner />
      </Suspense>
    </div>
  );
}
