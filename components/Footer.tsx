import Link from 'next/link';
import { Scale, AlertTriangle } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white mt-12 hidden sm:block">

      {/* ── Disclaimer légal ───────────────────────────────────── */}
      <div className="bg-amber-50 border-b border-amber-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">تنبيه : </span>
            هذا الموقع للمعلومات العامة فقط —{' '}
            <strong>لا يغني عن النصوص الرسمية في الجريدة الرسمية</strong>{' '}
            ولا يُعدّ استشارةً قانونية. المصدر الرسمي:{' '}
            <a
              href="https://www.sgg.gov.ma"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-amber-900"
            >
              sgg.gov.ma
            </a>
          </p>
        </div>
      </div>

      {/* ── Corps du pied de page ──────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            <span className="font-kufi text-lg font-bold text-slate-800">المدوّنة</span>
            <span className="text-slate-400 text-sm">— موسوعتك القانونية</span>
          </div>

          {/* Liens */}
          <nav className="flex flex-wrap items-center gap-5 text-sm text-slate-500">
            <Link href="/"         className="hover:text-blue-600">الرئيسية</Link>
            <Link href="/search"   className="hover:text-blue-600">البحث</Link>
            <Link href="/login"    className="hover:text-blue-600">تسجيل الدخول</Link>
            <a
              href="https://www.sgg.gov.ma"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600"
            >
              الجريدة الرسمية ↗
            </a>
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row
                        items-center justify-between gap-2 text-xs text-slate-400">
          <p>المدوّنة © {year} — جميع النصوص القانونية مصدرها الجريدة الرسمية المغربية (sgg.gov.ma)</p>
          <p>مرخّص للاستخدام التعليمي والبحثي</p>
        </div>
      </div>
    </footer>
  );
}
