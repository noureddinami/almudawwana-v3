'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, saveToken, API_BASE } from '@/lib/api';
import { Scale, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== password2) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await auth.register(fullName, email, password);
      saveToken(token);
      toast.success(`مرحباً ${user.full_name ?? user.email} 🎉`);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = `${API_BASE.replace('/api/v1', '')}/api/v1/auth/google/redirect`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50
                    flex flex-col items-center justify-center px-4 py-12">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">

        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <Scale className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-kufi text-2xl font-bold text-slate-900">المدوّنة</h1>
          <p className="text-slate-500 text-sm mt-1">موسوعتك القانونية المغربية</p>
        </div>

        <h2 className="text-xl font-semibold text-slate-800 mb-6 text-center">
          إنشاء حساب جديد
        </h2>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 py-3 border border-slate-300
                     rounded-xl text-sm font-medium text-slate-700 bg-white
                     hover:bg-slate-50 hover:border-slate-400 transition-all mb-5 shadow-sm"
        >
          <GoogleIcon />
          التسجيل بـ Google
        </button>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs text-slate-400">
            <span className="bg-white px-3">أو بالبريد الإلكتروني</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              الاسم الكامل
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="محمد الأمين"
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         bg-slate-50 placeholder:text-slate-400"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="exemple@email.com"
              required
              dir="ltr"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         bg-slate-50 placeholder:text-slate-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="8 أحرف على الأقل"
                required
                minLength={8}
                dir="ltr"
                className="w-full px-4 py-3 pl-10 border border-slate-300 rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           bg-slate-50 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              تأكيد كلمة المرور
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={password2}
              onChange={e => setPassword2(e.target.value)}
              placeholder="••••••••"
              required
              dir="ltr"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         bg-slate-50 placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm
                       hover:bg-blue-700 active:scale-[0.98] transition-all
                       disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400 text-center leading-relaxed">
          بإنشاء حساب، تقبل استخدام البيانات للأغراض التعليمية والبحثية فقط.
        </p>

        <div className="mt-5 text-center text-sm text-slate-500">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            سجّل الدخول
          </Link>
        </div>
      </div>

      <Link href="/" className="mt-5 text-sm text-slate-400 hover:text-slate-600">
        ← العودة للرئيسية
      </Link>
    </div>
  );
}
