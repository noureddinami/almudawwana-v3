'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { auth, clearToken, hasToken, User } from '@/lib/api';
import { Search, LogOut, Menu, X, UserPlus, FilePlus2, Mail, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const NAV_LINKS = [
  { href: '/',              label: 'الرئيسية',            anchor: false },
  { href: '/why',           label: 'حول المدوّنة',          anchor: false, blank: true },
  { href: '/codes',          label: 'النصوص القانونية',    anchor: false },
  { href: '/jurisprudence', label: 'الاجتهاد القضائي',    anchor: false },
  { href: '/#latest',       label: 'آخر الإضافات',        anchor: true  },
  { href: '/search',        label: 'البحث',               anchor: false },
  { href: '/request-code',  label: 'طلب إضافة نص قانوني', anchor: false },
  { href: '/contact',       label: 'تواصل معنا',          anchor: false },
];

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]         = useState<User | null>(null);
  const [searchQ, setSearchQ]   = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [hiddenLinks, setHiddenLinks] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(sessionStorage.getItem('nav_hidden') ?? '[]'); } catch { return []; }
  });
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (hasToken()) {
      auth.me()
        .then((r: any) => setUser(r.user ?? r))
        .catch(() => clearToken());
    }
  }, []);

  useEffect(() => {
    fetch('/api/settings/nav')
      .then(r => r.json())
      .then((d: { hidden?: string[] }) => {
        const h = d.hidden ?? [];
        setHiddenLinks(h);
        try { sessionStorage.setItem('nav_hidden', JSON.stringify(h)); } catch {}
      })
      .catch(() => {});
  }, []);

  useEffect(() => { setMenuOpen(false); setMobileSearchOpen(false); }, [pathname]);

  // Hide header on scroll down, show on scroll up (mobile only)
  useEffect(() => {
    const onScroll = () => {
      if (window.innerWidth >= 640) { setHeaderHidden(false); return; } // sm+ always visible
      const y = window.scrollY;
      if (y > lastScrollY.current && y > 60) setHeaderHidden(true);
      else setHeaderHidden(false);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`);
      setSearchQ('');
      setMenuOpen(false);
      setMobileSearchOpen(false);
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
    const base = href.split('#')[0];
    if (!base || base === '/') return false;
    return pathname.startsWith(base);
  };

  return (
    <header dir="rtl" className="sticky top-0 z-50 hidden sm:block">
      {/* Bandeau disclaimer — desktop uniquement */}
      <div className="bg-blue-900 text-blue-100 text-center py-1.5 text-xs hidden md:block">
        📋 النصوص الرسمية متاحة على{' '}
        <a href="https://www.sgg.gov.ma" target="_blank" rel="noopener noreferrer"
           className="underline hover:text-white">sgg.gov.ma</a>
        {' '}— المدوّنة للمعلومات العامة فقط
      </div>

      <nav className="bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 sm:h-16 gap-3">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <svg className="w-8 h-8" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M28 68 L28 132 L70 162 L70 38 Z" fill="#2152cc"/>
                <path d="M172 68 L172 132 L130 162 L130 38 Z" fill="#2152cc"/>
                <path d="M70 36 L100 20 L130 36 L130 164 L100 180 L70 164 Z" fill="#4a7fd4"/>
                <rect x="98" y="72" width="4" height="80" rx="2" fill="white"/>
                <path d="M96.5 72 Q100 63 103.5 72" fill="white"/>
                <path d="M50 94 Q100 87 150 94" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                <circle cx="54" cy="94" r="3.5" fill="white"/>
                <circle cx="146" cy="94" r="3.5" fill="white"/>
                <line x1="54" y1="97" x2="48" y2="116" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                <line x1="66" y1="97" x2="72" y2="116" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M46 116 Q59 112 74 116" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <line x1="146" y1="97" x2="140" y2="116" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                <line x1="134" y1="97" x2="128" y2="116" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M126 116 Q139 112 154 116" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <ellipse cx="100" cy="152" rx="13" ry="4.5" fill="white" opacity="0.9"/>
              </svg>
              <span className="font-kufi text-lg sm:text-xl font-bold text-slate-900 tracking-wide">
                المدوّنة
              </span>
            </Link>

            {/* Divider desktop */}
            <div className="hidden lg:block w-px h-6 bg-slate-200 mx-1" />

            {/* Nav links (desktop) */}
            <div className="hidden lg:flex items-center gap-0.5 flex-1">
              {NAV_LINKS.filter(l => !hiddenLinks.includes(l.href)).map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  target={(link as any).blank ? '_blank' : undefined}
                  rel={(link as any).blank ? 'noopener noreferrer' : undefined}
                  onClick={e => handleAnchorClick(e, link.href, link.anchor)}
                  className={`
                    px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap font-medium
                    ${link.href === '/request-code'
                      ? isActive(link.href)
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                      : isActive(link.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'}
                  `}
                >
                  {link.href === '/request-code' && <FilePlus2 className="w-3.5 h-3.5 inline ml-1 -mt-0.5" />}
                  {link.label}
                </a>
              ))}
            </div>

            {/* Mobile: search toggle button */}
            <button
              className="sm:hidden mr-auto p-2 text-slate-500 hover:text-blue-600
                         rounded-xl hover:bg-slate-50 transition-colors"
              onClick={() => setMobileSearchOpen(o => !o)}
              aria-label="بحث"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Search (desktop) */}
            <form onSubmit={handleSearch} className="hidden sm:flex max-w-xs w-full">
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

            {/* Hamburger (mobile + tablet) */}
            <button
              className="lg:hidden text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="القائمة"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* ── Mobile search bar (slide down) ─────────────────── */}
          <div className={`sm:hidden overflow-hidden transition-all duration-200 ease-in-out
            ${mobileSearchOpen ? 'max-h-20 opacity-100 pb-3' : 'max-h-0 opacity-0'}`}>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="ابحث في القوانين..."
                autoFocus={mobileSearchOpen}
                className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit"
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium
                           active:bg-blue-700">
                بحث
              </button>
            </form>
          </div>

          {/* ── Mobile / Tablet collapse menu ────────────────── */}
          <div className={`
            lg:hidden overflow-hidden transition-all duration-200 ease-in-out
            ${menuOpen ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'}
          `}>
            <div className="py-3 border-t border-slate-100 pb-4 space-y-1">
              {NAV_LINKS.filter(l => !hiddenLinks.includes(l.href)).map(link => {
                const isRequest = link.href === '/request-code';
                const isContact = link.href === '/contact';
                const isAbout = link.href === '/about';
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target={(link as any).blank ? '_blank' : undefined}
                    rel={(link as any).blank ? 'noopener noreferrer' : undefined}
                    onClick={e => handleAnchorClick(e, link.href, link.anchor)}
                    className={`
                      flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors
                      ${isActive(link.href)
                        ? isRequest
                          ? 'bg-emerald-50 text-emerald-700 font-medium'
                          : 'bg-blue-50 text-blue-700 font-medium'
                        : isRequest
                          ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'}
                    `}
                  >
                    {isRequest && <FilePlus2 className="w-4 h-4" />}
                    {isContact && <Mail className="w-4 h-4" />}
                    {isAbout && <Info className="w-4 h-4" />}
                    {link.label}
                  </a>
                );
              })}

              {/* Auth links in mobile menu */}
              <div className="border-t border-slate-100 pt-2 mt-2 sm:hidden">
                {user ? (
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-sm text-slate-600">{user.full_name ?? user.email}</span>
                    <button onClick={handleLogout}
                      className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600">
                      <LogOut className="w-4 h-4" />
                      خروج
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <Link href="/login"
                      className="flex-1 text-center text-sm text-slate-600 hover:text-blue-600 font-medium
                                 py-2.5 rounded-xl border border-slate-200 hover:border-blue-200">
                      الدخول
                    </Link>
                    <Link href="/register"
                      className="flex-1 flex items-center justify-center gap-1.5 text-sm bg-blue-600
                                 text-white py-2.5 rounded-xl hover:bg-blue-700 font-medium">
                      <UserPlus className="w-3.5 h-3.5" />
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
