'use client';

import { useEffect, useState } from 'react';

const SECTIONS = [
  { id: 'codes',    label: 'القوانين' },
  { id: 'features', label: 'المميزات' },
  { id: 'search',   label: 'البحث' },
  { id: 'how',      label: 'كيف تعمل' },
  { id: 'comments', label: 'التعليقات' },
];

export default function HomeSectionNav() {
  const [active, setActive] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );

    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 120;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-16 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`
                px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 shrink-0
                ${active === s.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'}
              `}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
