'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Scale, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * This page is only reached when the OAuth callback has an error
 * (the success case is handled by the route.ts which redirects directly).
 * It also serves as a visual loading state while the redirect happens.
 */
function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const error = params.get('error');
    if (error) {
      const messages: Record<string, string> = {
        no_code: 'لم يتم استلام رمز المصادقة',
        auth_failed: 'فشل تسجيل الدخول بـ Google',
      };
      toast.error(messages[error] ?? 'حدث خطأ أثناء تسجيل الدخول');
      router.replace('/login');
    } else {
      // If no error and no code, user likely landed here directly
      router.replace('/');
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
