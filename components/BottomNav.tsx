'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Scale, Search, User } from 'lucide-react';

const TABS = [
  { href: '/',       label: 'الرئيسية', icon: Home   },
  { href: '/codes',  label: 'القوانين',  icon: Scale  },
  { href: '/search', label: 'البحث',     icon: Search },
  { href: '/login',  label: 'حسابي',     icon: User   },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on admin pages
  if (pathname.startsWith('/admin')) return null;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
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
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5
                          active:scale-95 transition-all duration-150
                          ${active
                            ? 'text-blue-600'
                            : 'text-slate-400 active:text-slate-600'}`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              <span className={`text-[10px] leading-none font-medium
                               ${active ? 'text-blue-600' : 'text-slate-400'}`}>
                {tab.label}
              </span>
              {active && (
                <div className="absolute top-0 w-8 h-0.5 bg-blue-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
