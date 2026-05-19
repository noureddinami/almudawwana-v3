'use client';

import { useState } from 'react';
import { Share2, Link2, Check, MessageCircle } from 'lucide-react';

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  variant?: 'icon' | 'button';
  className?: string;
}

export default function ShareButton({
  title = 'المدوّنة — الموسوعة القانونية المغربية',
  text,
  url,
  variant = 'button',
  className = '',
}: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = text || title;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
      } catch {}
    } else {
      setShowMenu(o => !o);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
    setShowMenu(false);
  };

  const shareLinks = [
    {
      name: 'واتساب',
      icon: MessageCircle,
      color: 'text-green-600 hover:bg-green-50',
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`,
    },
    {
      name: 'فيسبوك',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: 'text-blue-600 hover:bg-blue-50',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'X',
      icon: XIcon,
      color: 'text-slate-800 hover:bg-slate-50',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
  ];

  if (variant === 'icon') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={handleNativeShare}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="مشاركة"
          title="مشاركة"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 min-w-[160px]">
              {shareLinks.map(s => {
                const Icon = s.icon;
                return (
                  <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                     onClick={() => setShowMenu(false)}
                     className={`flex items-center gap-2.5 px-3 py-2 text-sm ${s.color} transition-colors`}>
                    <Icon className="w-4 h-4" />
                    {s.name}
                  </a>
                );
              })}
              <button onClick={copyLink}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors w-full">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
                {copied ? 'تم النسخ!' : 'نسخ الرابط'}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleNativeShare}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600
                   bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300
                   transition-colors shadow-sm active:scale-95"
      >
        <Share2 className="w-4 h-4" />
        مشاركة
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 min-w-[160px]">
            {shareLinks.map(s => {
              const Icon = s.icon;
              return (
                <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                   onClick={() => setShowMenu(false)}
                   className={`flex items-center gap-2.5 px-3 py-2 text-sm ${s.color} transition-colors`}>
                  <Icon className="w-4 h-4" />
                  {s.name}
                </a>
              );
            })}
            <button onClick={copyLink}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors w-full">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
              {copied ? 'تم النسخ!' : 'نسخ الرابط'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
