/**
 * Shared utilities for code type colors and icons.
 * Used by both CodesGrid (client) and the homepage (server).
 */

import {
  FileText, Landmark, ScrollText, Gavel, Users, Briefcase,
  Scale, Building2, Heart, FileCheck, ShieldCheck,
  Layers, Globe, Truck, Droplets, Trees, BookOpen,
} from 'lucide-react';
import type { ComponentType } from 'react';

// ─── Color palette ────────────────────────────────────────────────────────────

export const COLOR_PALETTE: Record<string, {
  iconBg: string; iconText: string;
  activeBg: string; activeText: string;
  badge: string; badgeText: string;
  dot: string; border: string;
}> = {
  blue:   { iconBg: 'bg-blue-100',   iconText: 'text-blue-600',   activeBg: 'bg-blue-600',   activeText: 'text-white', badge: 'bg-blue-50',   badgeText: 'text-blue-700',   dot: 'bg-blue-400',   border: 'border-blue-200'   },
  teal:   { iconBg: 'bg-teal-100',   iconText: 'text-teal-600',   activeBg: 'bg-teal-600',   activeText: 'text-white', badge: 'bg-teal-50',   badgeText: 'text-teal-700',   dot: 'bg-teal-400',   border: 'border-teal-200'   },
  violet: { iconBg: 'bg-violet-100', iconText: 'text-violet-600', activeBg: 'bg-violet-600', activeText: 'text-white', badge: 'bg-violet-50', badgeText: 'text-violet-700', dot: 'bg-violet-400', border: 'border-violet-200' },
  amber:  { iconBg: 'bg-amber-100',  iconText: 'text-amber-600',  activeBg: 'bg-amber-500',  activeText: 'text-white', badge: 'bg-amber-50',  badgeText: 'text-amber-700',  dot: 'bg-amber-400',  border: 'border-amber-200'  },
  green:  { iconBg: 'bg-green-100',  iconText: 'text-green-600',  activeBg: 'bg-green-600',  activeText: 'text-white', badge: 'bg-green-50',  badgeText: 'text-green-700',  dot: 'bg-green-400',  border: 'border-green-200'  },
  red:    { iconBg: 'bg-red-100',    iconText: 'text-red-600',    activeBg: 'bg-red-600',    activeText: 'text-white', badge: 'bg-red-50',    badgeText: 'text-red-700',    dot: 'bg-red-400',    border: 'border-red-200'    },
  slate:  { iconBg: 'bg-slate-100',  iconText: 'text-slate-500',  activeBg: 'bg-slate-600',  activeText: 'text-white', badge: 'bg-slate-100', badgeText: 'text-slate-600',  dot: 'bg-slate-400',  border: 'border-slate-200'  },
};

export const FALLBACK_PALETTE = COLOR_PALETTE.slate;

// ─── Icon mapping ─────────────────────────────────────────────────────────────

export function getTypeIcon(slug: string, nameAr: string): ComponentType<{ className?: string }> {
  const s = slug.toLowerCase();
  const n = nameAr;
  if (s.includes('constitu') || n.includes('دستور'))                                             return Landmark;
  if (s.includes('organic') || n.includes('تنظيمي'))                                            return ScrollText;
  if (s.includes('criminal') || s.includes('penal') || n.includes('جنائي') || n.includes('جزائي')) return Gavel;
  if (s.includes('family') || n.includes('أسرة') || n.includes('أسري'))                         return Users;
  if (s.includes('commercial') || s.includes('trade') || n.includes('تجار'))                    return Briefcase;
  if (s.includes('civil') || n.includes('مدن') || n.includes('الإلتزام'))                       return Scale;
  if (s.includes('labor') || s.includes('work') || n.includes('شغل') || n.includes('عمل'))      return ShieldCheck;
  if (s.includes('admin') || n.includes('إدار'))                                                 return Building2;
  if (s.includes('social') || n.includes('اجتماع'))                                             return Heart;
  if (s.includes('decree') || n.includes('مرسوم'))                                              return FileCheck;
  if (s.includes('transport') || n.includes('سير') || n.includes('نقل'))                        return Truck;
  if (s.includes('water') || n.includes('ماء') || n.includes('مائ'))                            return Droplets;
  if (s.includes('environ') || n.includes('بيئ') || n.includes('غاب'))                          return Trees;
  if (s.includes('ordinary') || n.includes('عادي'))                                              return FileText;
  if (s.includes('code') || n.includes('مدونة'))                                                return BookOpen;
  if (n.includes('دولي') || n.includes('خارج'))                                                 return Globe;
  if (n.includes('مسطرة') || n.includes('إجراء'))                                               return Layers;
  return FileText;
}
