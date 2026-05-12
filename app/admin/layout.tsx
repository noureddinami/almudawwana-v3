'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth, clearToken, User } from '@/lib/api';
import {
  LayoutDashboard, Users, BookOpen, FileText, LogOut, Menu, X,
  ChevronRight, Scale, Upload, MessageSquare, Tag,
} from 'lucide-react';

const NAV = [
  { href: '/admin',             label: 'لوحة التحكم',  icon: LayoutDashboard, exact: true },
  { href: '/admin/users',       label: 'المستخدمون',    icon: Users },
  { href: '/admin/codes',       label: 'القوانين',      icon: BookOpen },
  { href: '/admin/code-types',  label: 'أنواع القوانين', icon: Tag },
  { href: '/admin/articles',    label: 'المواد',         icon: FileText },
  { href: '/admin/comments',    label: 'التعليقات',     icon: MessageSquare },
  { href: '/admin/pdfs',        label: 'استيراد PDF',   icon: Upload },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]         = useState<User | null>(null);
  const [loading, setLoading]   = useState(true);
  const [sideOpen, setSideOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('mudawwana_token');
    if (!token) { router.replace('/login'); return; }

    auth.me()
      .then((r: any) => {
        const u: User = r.user ?? r;
        if (u.role !== 'admin' && u.role !== 'moderator') {
          router.replace('/');
          return;
        }
        setUser(u);
        setLoading(false);
      })
      .catch(() => {
        clearToken();
        router.replace('/login');
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = (item: typeof NAV[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const handleLogout = async () => {
    try { await auth.logout(); } catch {}
    clearToken();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-100" dir="rtl">
      {/* Overlay mobile */}
      {sideOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSideOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 right-0 h-full w-64 bg-slate-900 text-white flex flex-col z-30
          transform transition-transform duration-200
          ${sideOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          lg:static lg:h-screen
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-kufi font-bold text-lg leading-tight">المدوّنة</p>
            <p className="text-xs text-slate-400">لوحة الإدارة</p>
          </div>
          <button className="lg:hidden mr-auto text-slate-400" onClick={() => setSideOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 space-y-1 px-3">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSideOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
                {active && <ChevronRight className="w-3 h-3 mr-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="border-t border-slate-700 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {(user?.full_name ?? user?.email ?? '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name ?? '—'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300
                       hover:bg-slate-800 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setSideOpen(true)} className="text-slate-600">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-kufi font-bold text-slate-900">لوحة الإدارة</span>
          <Link href="/" className="mr-auto text-xs text-blue-600">
            العودة للموقع
          </Link>
        </header>

        {/* Back link (desktop) */}
        <div className="hidden lg:flex items-center px-6 pt-4">
          <Link href="/" className="text-xs text-blue-600 hover:underline">
            ← العودة للموقع
          </Link>
        </div>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
