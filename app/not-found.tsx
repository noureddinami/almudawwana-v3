import Link from 'next/link';
import { Scale, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
        <Scale className="w-8 h-8 text-blue-600" />
      </div>
      <h1 className="font-kufi text-6xl font-bold text-slate-200 mb-2">404</h1>
      <h2 className="font-kufi text-2xl font-bold text-slate-800 mb-3">الصفحة غير موجودة</h2>
      <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-8">
        لم نعثر على الصفحة التي تبحث عنها. ربما تم نقل هذا المحتوى أو حذفه.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/"
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium
                     hover:bg-blue-700 transition-colors"
        >
          العودة للرئيسية
        </Link>
        <Link
          href="/search"
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200
                     text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <Search className="w-4 h-4" />
          البحث في القوانين
        </Link>
      </div>
    </div>
  );
}
