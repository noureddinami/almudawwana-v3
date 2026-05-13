'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth, clearToken, hasToken, User } from '@/lib/api';
import { Scale, Search, LogOut, Menu, X, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const NAV_LINKS = [
  { href: '/',          label: 'الرئيسية',        anchor: false },
  { href: '/#features', label: 'لماذا المدوّنة؟',  anchor: true  },
  { href: '/codes',     label: 'النصوص القانونية', anchor: false },
  { href: '/#latest',   label: 'آخر الإضافات',    anchor: true  },
  { href: '/search',    label: 'البحث',            anchor: false },
  { href: '/contact',   label: 'تواصل معنا',       anchor: false },
];

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]         = useState<User | null>(null);
  const [searchQ, setSearchQ]   = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (hasToken()) {
      auth.me()
        .then((r: any) => setUser(r.user ?? r))
        .catch(() => clearToken());
    }
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`);
      setSearchQ('');
      setMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try { await auth.logout(); } catch {}
    clearToken();
    setUser(null);
    toast.success('تم تسجيل الخروج');
    router.push('/');
  };

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, isAnchor: boolean) => {
    if (!isAnchor) return;
    const hash = href.split('#')[1];
    if (!hash) return;
    if (pathname === '/' || pathname === '') {
      e.preventDefault();
      const el = document.getElementById(hash);
      if (el) {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
      }
      setMenuOpen(false);
    }
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href.split('#')[0]) && href.split('#')[0] !== '/';
  };

  return (
    <header dir="rtl">
      {/* Bandeau */}
      <div className="bg-blue-900 text-blue-100 text-center py-1.5 text-xs hidden sm:block">
        📋 النصوص الرسمية متاحة على{' '}
        <a href="https://www.sgg.gov.ma" target="_blank" rel="noopener noreferrer"
           className="underline hover:text-white">sgg.gov.ma</a>
        {' '}— المدوّنة للمعلومات العامة فقط
      </div>

      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-3">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="font-kufi text-xl font-bold text-slate-900 tracking-wide hidden sm:block">
                المدوّنة
              </span>
            </Link>

            {/* Divider */}
            <div className="hidden lg:block w-px h-6 bg-slate-200 mx-1" />

            {/* Nav links (desktop) */}
            <div className="hidden lg:flex items-center gap-0.5 flex-1">
              {NAV_LINKS.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={e => handleAnchorClick(e, link.href, link.anchor)}
                  className={`
                    px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap font-medium
                    ${isActive(link.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'}
                  `}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Search (desktop) */}
            <form onSubmit={handleSearch} className="hidden md:flex max-w-xs w-full">
              <div className="relative w-full">
                <input
                  type="text" value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="ابحث في القوانين..."
                  className="w-full pr-4 pl-10 py-2 text-sm border border-slate-300 rounded-full
                             bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent placeholder:text-slate-400"
                />
                <button type="submit"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Auth (desktop) */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              {user ? (
                <>
                  <span className="text-sm text-slate-500 max-w-[100px] truncate">{user.full_name ?? user.email}</span>
                  <button onClick={handleLogout}
                    className="flex items-center gap-1 text-sm text-slate-400 hover:text-red-600 px-2">
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login"
                    className="text-sm text-slate-600 hover:text-blue-600 font-medium px-2 py-1.5">
                    الدخول
                  </Link>
                  <Link href="/register"
                    className="flex items-center gap-1.5 text-sm bg-blue-600 text-white
                               px-4 py-2 rounded-full hover:bg-blue-700 font-medium shadow-sm shrink-0">
                    <UserPlus className="w-3.5 h-3.5" />
                    انشئ حسابك
                  </Link>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className="lg:hidden mr-auto text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="القائمة"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile menu */}
          <div className={`
            lg:hidden overflow-hidden transition-all duration-200 ease-in-out
            ${menuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}
          `}>
            <div className="py-3 border-t border-slate-100 pb-4 space-y-1">

              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2 pb-3">
                <input
                  type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="ابحث..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                  بحث
                </button>
              </form>

              {/* Nav links */}
              <div className="border-t border-slate-100 pt-2">
                {NAV_LINKS.map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={e => handleAnchorClick(e, link.href, link.anchor)}
                    className={`
                      flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors
                      ${isActive(link.href)
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'}
                    `}
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              {/* Auth */}
              <div className="border-t border-slate-100 pt-3">
                {user ? (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 px-3 pb-1 truncate">{user.full_name ?? user.email}</p>
                    <button onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-600
                                 hover:bg-red-50 rounded-lg transition-colors">
                      <LogOut className="w-4 h-4" />
                      تسجيل الخروج
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 px-1">
                    <Link href="/login" onClick={() => setMenuOpen(false)}
                      className="flex-1 text-center py-2.5 text-sm text-blue-600 font-medium
                                 border border-blue-200 rounded-xl hover:bg-blue-50">
                      الدخول
                    </Link>
                    <Link href="/register" onClick={() => setMenuOpen(false)}
                      className="flex-1 text-center py-2.5 text-sm text-white bg-blue-600
                                 rounded-xl hover:bg-blue-700 font-medium">
                      انشئ حسابك
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </nav>
    </header>
  );
}
