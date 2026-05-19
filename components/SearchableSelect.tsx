'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  sub?: string;
}

interface Props {
  name: string;
  options: Option[];
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

export default function SearchableSelect({ name, options, defaultValue = '', placeholder = 'اختر...', className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(defaultValue);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(o => o.value === selected);

  const filtered = search
    ? options.filter(o => o.label.includes(search) || o.sub?.includes(search))
    : options;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input type="hidden" name={name} value={selected} />

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 text-sm border border-slate-300 rounded-xl px-3 py-3 bg-white
                   focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
      >
        <span className={`flex-1 truncate ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
          {selectedOption?.label || placeholder}
        </span>
        {selected ? (
          <X className="w-4 h-4 text-slate-400 hover:text-red-500 shrink-0"
             onClick={e => { e.stopPropagation(); setSelected(''); setSearch(''); }} />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg
                        max-h-64 overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-slate-100">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث..."
                className="w-full pr-3 pl-8 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50
                           focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            <button
              type="button"
              onClick={() => { setSelected(''); setOpen(false); setSearch(''); }}
              className={`w-full text-right px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors
                         ${!selected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-500'}`}
            >
              {placeholder}
            </button>
            {filtered.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { setSelected(o.value); setOpen(false); setSearch(''); }}
                className={`w-full text-right px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors
                           ${selected === o.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
              >
                {o.label}
                {o.sub && <span className="text-slate-400 text-xs mr-2">{o.sub}</span>}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-4">لا توجد نتائج</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
