'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  Home, Scale, Gavel, Download, MoreHorizontal,
  FilePlus2, Mail, User, X, Info,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

const TABS = [
  { href: '/',              label: 'الرئيسية',  icon: Home     },
  { href: '/codes',         label: 'القوانين',   icon: Scale    },
  { href: '/jurisprudence', label: 'الاجتهاد',   icon: Gavel    },
  { href: '/offline',       label: 'المحمّلة',   icon: Download },
];

const MORE_LINKS = [
  { href: '/request-code', label: 'طلب إضافة نص قانوني', icon: FilePlus2, color: 'text-emerald-600', external: false },
  { href: '/contact',      label: 'تواصل معنا',          icon: Mail,      color: 'text-blue-600',    external: false },
  { href: '/login',        label: 'حسابي',               icon: User,      color: 'text-slate-600',   external: false },
  { href: '/why',          label: 'حول المدوّنة',          icon: Info,      color: 'text-blue-600',    external: true  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hide on admin pages
  if (pathname.startsWith('/admin')) return null;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const isMoreActive = MORE_LINKS.some(l => isActive(l.href));

  // Close menu on route change
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [moreOpen]);

  return (
    <>
      {/* Overlay backdrop */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] sm:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More menu popup */}
      <div
        ref={menuRef}
        className={`
          fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-50
          sm:hidden transition-all duration-200 ease-in-out px-3 pb-2
          ${moreOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
      >
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-800">المزيد</span>
            <button
              onClick={() => setMoreOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Links */}
          <div className="py-1">
            {MORE_LINKS.map(link => {
              const Icon = link.icon;
              const active = isActive(link.href);
              const cls = `flex items-center gap-3 px-4 py-3 text-sm transition-colors
                    ${active
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'}`;
              return link.external ? (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
                  <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : link.color}`} />
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href} className={cls}>
                  <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : link.color}`} />
                  {link.label}
                </Link>
              );
            })}

            {/* Notification toggle */}
            <div className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700">
              <NotificationBell labeled className="w-full justify-start gap-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200
                   shadow-[0_-2px_10px_rgba(0,0,0,0.06)]
                   sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch h-14">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = isActive(tab.href);
            const isCodes = tab.href === '/codes';
            const isJuris = tab.href === '/jurisprudence';
            const color = active
              ? isCodes ? 'text-blue-600' : isJuris ? 'text-purple-600' : 'text-blue-600'
              : isCodes ? 'text-blue-500' : isJuris ? 'text-purple-500' : 'text-slate-400';
            const barColor = isCodes ? 'bg-blue-600' : isJuris ? 'bg-purple-600' : 'bg-blue-600';
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5
                            active:scale-95 transition-all duration-150 ${color}`}
              >
                <Icon className={`w-5 h-5 ${active || isCodes || isJuris ? 'stroke-[2]' : 'stroke-[1.5]'}`} />
                <span className={`text-[10px] leading-none ${isCodes || isJuris ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
                {active && (
                  <div className={`absolute top-0 w-8 h-0.5 rounded-full ${barColor}`} />
                )}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(o => !o)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5
                        active:scale-95 transition-all duration-150
                        ${moreOpen || isMoreActive
                          ? 'text-blue-600'
                          : 'text-slate-400 active:text-slate-600'}`}
          >
            <MoreHorizontal className={`w-5 h-5 ${moreOpen || isMoreActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
            <span className={`text-[10px] leading-none font-medium
                             ${moreOpen || isMoreActive ? 'text-blue-600' : 'text-slate-400'}`}>
              المزيد
            </span>
            {(moreOpen || isMoreActive) && (
              <div className="absolute top-0 w-8 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
