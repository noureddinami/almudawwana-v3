'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminStats, adminComments, DashboardStats } from '@/lib/adminApi';
import {
  Users, BookOpen, FileText, Eye, TrendingUp, AlertCircle,
  MessageSquare, CheckCircle, XCircle, Clock, UserCheck,
  BarChart2, Activity, FilePlus2, Smartphone,
  Search, Download, Globe, Zap, LayoutList,
} from 'lucide-react';

/* ── helpers ─────────────────────────────────────────────────────────── */

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return `منذ ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} س`;
  return `منذ ${Math.floor(h / 24)} ي`;
}

function fmt(n: number) { return n.toLocaleString('ar-MA'); }

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-emerald-100 text-emerald-700',
  suspended: 'bg-red-100 text-red-700',
  banned:    'bg-red-100 text-red-700',
  admin:     'bg-violet-100 text-violet-700',
  moderator: 'bg-blue-100 text-blue-700',
  user:      'bg-slate-100 text-slate-600',
};

/* ── sub-components ──────────────────────────────────────────────────── */

function KpiCard({
  label, value, sub, icon: Icon, href, color,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; href?: string; color: string;
}) {
  const inner = (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex gap-4 hover:shadow-md transition-shadow group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
          {value}
        </p>
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5 leading-tight">{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 max-w-lg">
      <AlertCircle className="w-5 h-5 shrink-0" />
      <p className="text-sm">{msg}</p>
    </div>
  );
}

/* ── ActivityBar ─────────────────────────────────────────────────────── */

function ActivityChart({ data }: { data: { date: string; count: number }[] }) {
  const DAY_LABELS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  // Build a full 7-day array ending today
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const iso = d.toISOString().split('T')[0];
    const found = data.find(r => r.date === iso);
    return { date: iso, count: found ? found.count : 0, label: DAY_LABELS[d.getDay()] };
  });

  const maxCount = Math.max(...days.map(d => d.count), 1);

  return (
    <div className="flex items-end gap-2 h-28 w-full">
      {days.map(d => {
        const pct = Math.max((d.count / maxCount) * 100, d.count > 0 ? 8 : 2);
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-slate-500">{d.count > 0 ? d.count : ''}</span>
            <div
              className="w-full rounded-t-md bg-blue-500 transition-all"
              style={{ height: `${pct}%` }}
              title={`${d.date}: ${d.count}`}
            />
            <span className="text-[9px] text-slate-400 truncate w-full text-center">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Analytics sub-components ───────────────────────────────────────── */

interface AnalyticsStats {
  today_views:     number;
  today_searches:  number;
  today_downloads: number;
  views30d:        { date: string; count: number }[];
  topPages:        { path: string; count: number }[];
  topSearches:     { query: string; count: number }[];
  events:          { type: string; label: string; sub?: string; created_at: string }[];
}

function Views30dChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  // Show every ~5th label to avoid clutter
  return (
    <div className="flex items-end gap-px h-24 w-full">
      {data.map((d, i) => {
        const pct = Math.max((d.count / max) * 100, d.count > 0 ? 3 : 1);
        const showLabel = i === 0 || i === 14 || i === 29 || d.count === max;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-px group relative">
            <div
              className="w-full rounded-t-sm bg-blue-500 group-hover:bg-blue-400 transition-colors cursor-default"
              style={{ height: `${pct}%` }}
            />
            {showLabel && (
              <span className="absolute -bottom-4 text-[8px] text-slate-400 whitespace-nowrap">
                {d.date.slice(5)}
              </span>
            )}
            {/* tooltip */}
            <div className="absolute bottom-full mb-1 hidden group-hover:flex bg-slate-800 text-white
                            text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
              {d.date} · {d.count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EventFeed({ events }: { events: AnalyticsStats['events'] }) {
  const icons: Record<string, { icon: React.ElementType; cls: string; label: string }> = {
    search:   { icon: Search,   cls: 'bg-violet-50 text-violet-600', label: 'بحث'      },
    download: { icon: Download, cls: 'bg-emerald-50 text-emerald-600', label: 'تحميل'  },
    view:     { icon: Eye,      cls: 'bg-blue-50 text-blue-600',      label: 'زيارة'   },
  };

  function timeAgoShort(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'الآن';
    if (m < 60) return `${m}د`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}س`;
    return `${Math.floor(h / 24)}ي`;
  }

  if (!events.length) return (
    <p className="text-sm text-slate-400 text-center py-6">لا توجد أحداث بعد</p>
  );

  return (
    <ul className="space-y-2">
      {events.map((ev, i) => {
        const meta = icons[ev.type] ?? icons.view;
        const Icon = meta.icon;
        return (
          <li key={i} className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${meta.cls}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-800 truncate font-medium">{ev.label}</p>
              {ev.sub && <p className="text-[10px] text-slate-400">{ev.sub}</p>}
            </div>
            <span className="text-[10px] text-slate-400 shrink-0">{timeAgoShort(ev.created_at)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/* ── main page ───────────────────────────────────────────────────────── */

interface PwaStats { total: number; ios: number; android: number; desktop: number; month: number; }

export default function AdminDashboard() {
  const [stats, setStats]             = useState<DashboardStats | null>(null);
  const [pwaStats, setPwaStats]       = useState<PwaStats | null>(null);
  const [analytics, setAnalytics]     = useState<AnalyticsStats | null>(null);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [dismissed, setDismissed]     = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      adminStats.dashboard(),
      fetch('/api/admin/pwa-stats').then(r => r.ok ? r.json() : null),
      fetch('/api/admin/analytics-stats').then(r => r.ok ? r.json() : null),
    ])
      .then(([dash, pwa, ana]) => {
        setStats(dash);
        if (pwa) setPwaStats(pwa);
        if (ana) setAnalytics(ana);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error)   return <ErrorBox msg={error} />;
  if (!stats)  return null;

  const pendingVisible = stats.pending_comments.filter(c => !dismissed.has(c.id));

  async function handleApprove(id: string) {
    setApprovingId(id);
    try {
      await adminComments.update(id, { status: 'approved' });
      setDismissed(prev => new Set([...prev, id]));
    } catch { /* ignore */ }
    setApprovingId(null);
  }

  async function handleReject(id: string) {
    setRejectingId(id);
    try {
      await adminComments.update(id, { status: 'rejected' });
      setDismissed(prev => new Set([...prev, id]));
    } catch { /* ignore */ }
    setRejectingId(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 font-kufi">لوحة التحكم</h1>

      {/* ── الإحصائيات اليوم (analytics KPIs) — shown at top when available ── */}
      {analytics && (
        <>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <h2 className="font-kufi text-lg font-bold text-slate-800">الإحصائيات اليوم</h2>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-4 -mt-2">
            {[
              { label: 'زيارات اليوم',   value: analytics.today_views,     icon: Globe,    color: 'bg-blue-50 text-blue-600'       },
              { label: 'بحث اليوم',      value: analytics.today_searches,   icon: Search,   color: 'bg-violet-50 text-violet-600'   },
              { label: 'تحميلات اليوم',  value: analytics.today_downloads,  icon: Download, color: 'bg-emerald-50 text-emerald-600' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3 items-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{fmt(s.value)}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── PWA installs banner ── */}
      {pwaStats && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-slate-800">تثبيتات التطبيق (PWA)</h2>
            <span className="mr-auto text-xs text-slate-400">+{fmt(pwaStats.month)} هذا الشهر</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'إجمالي التثبيتات', value: pwaStats.total,   color: 'text-blue-600',    bg: 'bg-blue-50'    },
              { label: 'Android',           value: pwaStats.android, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'iOS',               value: pwaStats.ios,     color: 'text-slate-600',   bg: 'bg-slate-50'   },
              { label: 'Desktop',           value: pwaStats.desktop, color: 'text-violet-600',  bg: 'bg-violet-50'  },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                <p className={`text-2xl font-bold ${s.color}`}>{fmt(s.value)}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Row 1: KPI cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          label="المستخدمون"
          value={fmt(stats.users.total)}
          sub={`${fmt(stats.users.active)} نشط — +${fmt(stats.users.new_week)} هذا الأسبوع`}
          icon={Users}
          href="/admin/users"
          color="bg-blue-50 text-blue-600"
        />
        <KpiCard
          label="القوانين"
          value={fmt(stats.codes.total)}
          sub={`${fmt(stats.codes.in_force)} سارية`}
          icon={BookOpen}
          href="/admin/codes"
          color="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          label="المواد"
          value={fmt(stats.articles.total)}
          sub={`${fmt(stats.articles.in_force)} ساري — ${fmt(stats.articles.amended)} معدّل`}
          icon={FileText}
          href="/admin/articles"
          color="bg-violet-50 text-violet-600"
        />
        <KpiCard
          label="المشاهدات"
          value={fmt(stats.articles.total_views)}
          sub="إجمالي مشاهدات المواد"
          icon={Eye}
          color="bg-orange-50 text-orange-600"
        />
        <KpiCard
          label="طلبات الإضافة"
          value={fmt(stats.code_requests?.pending ?? 0)}
          sub={`من ${fmt(stats.code_requests?.total ?? 0)} إجمالاً`}
          icon={FilePlus2}
          href="/admin/code-requests"
          color={stats.code_requests?.pending > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}
        />
        <KpiCard
          label="التعليقات المعلّقة"
          value={fmt(stats.comments.pending)}
          sub={`من ${fmt(stats.comments.total)} إجمالاً`}
          icon={MessageSquare}
          href="/admin/comments"
          color={stats.comments.pending > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}
        />
      </div>

      {/* ── Row 2: charts + recent users ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Activity chart */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-slate-800">نشاط الأسبوع</h2>
            <span className="mr-auto text-xs text-slate-400">مواد مضافة / يوم</span>
          </div>
          <ActivityChart data={stats.activity_week} />
        </section>

        {/* Codes breakdown */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-slate-800">توزيع المواد حسب القانون</h2>
          </div>
          <ul className="space-y-2">
            {stats.codes_breakdown.slice(0, 8).map(c => {
              const max = stats.codes_breakdown[0]?.total_articles ?? 1;
              const pct = Math.round((c.total_articles / max) * 100);
              return (
                <li key={c.id}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-slate-700 truncate max-w-[65%]">{c.title_ar}</span>
                    <span className="text-xs text-slate-500 font-medium">{fmt(c.total_articles)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Top viewed */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-slate-800">الأكثر مشاهدة</h2>
          </div>
          <ul className="space-y-2.5">
            {stats.top_viewed.map((a, i) => (
              <li key={a.id} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 truncate">
                    الفصل {a.number}
                    {a.code && <span className="text-xs text-slate-400 mr-1">— {a.code.title_ar}</span>}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                  <Eye className="w-3 h-3" />
                  {fmt(a.view_count)}
                </span>
              </li>
            ))}
            {stats.top_viewed.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">لا توجد بيانات</p>
            )}
          </ul>
        </section>
      </div>

      {/* ── Row 3: pending comments + recent users ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pending comments */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-slate-800">تعليقات في الانتظار</h2>
            {stats.comments.pending > 0 && (
              <span className="mr-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                {stats.comments.pending}
              </span>
            )}
            <Link href="/admin/comments" className="text-xs text-blue-500 hover:underline ml-1">
              عرض الكل
            </Link>
          </div>

          {pendingVisible.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-2 text-slate-400">
              <CheckCircle className="w-8 h-8 text-emerald-300" />
              <p className="text-sm">لا توجد تعليقات معلّقة</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pendingVisible.map(c => (
                <li key={c.id} className="border border-slate-100 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-slate-800 line-clamp-2 leading-relaxed flex-1">{c.content_ar}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                    <span>{c.author?.full_name ?? c.author?.email ?? '—'}</span>
                    {c.article && (
                      <>
                        <span>·</span>
                        <span>الفصل {c.article.number}</span>
                        {c.article.code && <span className="text-slate-300">— {c.article.code.title_ar}</span>}
                      </>
                    )}
                    <span>·</span>
                    <span>{timeAgo(c.created_at)}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleApprove(c.id)}
                      disabled={approvingId === c.id}
                      className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium
                                 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" />
                      {approvingId === c.id ? '...' : 'قبول'}
                    </button>
                    <button
                      onClick={() => handleReject(c.id)}
                      disabled={rejectingId === c.id}
                      className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium
                                 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-3 h-3" />
                      {rejectingId === c.id ? '...' : 'رفض'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Comments stats row */}
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'مقبول', value: stats.comments.approved, color: 'text-emerald-600' },
              { label: 'معلّق', value: stats.comments.pending,  color: 'text-amber-600' },
              { label: 'مرفوض', value: stats.comments.rejected, color: 'text-red-500' },
            ].map(s => (
              <div key={s.label}>
                <p className={`text-lg font-bold ${s.color}`}>{fmt(s.value)}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent users */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-slate-800">آخر المنضمّين</h2>
            <Link href="/admin/users" className="mr-auto text-xs text-blue-500 hover:underline">
              عرض الكل
            </Link>
          </div>
          <ul className="space-y-2.5">
            {stats.recent_users.map(u => (
              <li key={u.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 text-sm font-semibold">
                  {(u.full_name ?? u.email).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{u.full_name ?? '—'}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                    {u.role}
                  </span>
                  <span className="text-[10px] text-slate-400">{timeAgo(u.created_at)}</span>
                </div>
              </li>
            ))}
            {stats.recent_users.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">لا توجد بيانات</p>
            )}
          </ul>

          {/* Users quick stats */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>+{fmt(stats.users.new_week)} هذا الأسبوع</span>
            <span>+{fmt(stats.users.new_month)} هذا الشهر</span>
            <span>{fmt(stats.users.active)} نشط من {fmt(stats.users.total)}</span>
          </div>
        </section>
      </div>

      {/* ── Row 4: quick actions ── */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3">وصول سريع</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/admin/codes/new',    label: 'إضافة قانون',     icon: BookOpen,      color: 'text-emerald-600 bg-emerald-50' },
            { href: '/admin/articles',     label: 'إدارة المواد',    icon: FileText,      color: 'text-violet-600 bg-violet-50' },
            { href: '/admin/comments',     label: 'مراجعة التعليقات', icon: MessageSquare, color: 'text-amber-600 bg-amber-50' },
            { href: '/admin/users',        label: 'إدارة المستخدمين', icon: Users,         color: 'text-blue-600 bg-blue-50' },
          ].map(a => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-700">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          Analytics section — only renders once tables exist
      ════════════════════════════════════════════════════════════════════ */}
      {analytics && (
        <>
          {/* ── Row: 30-day chart + event feed ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* 30-day visitors chart */}
            <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-4 h-4 text-blue-500" />
                <h2 className="font-semibold text-slate-800">الزيارات — 30 يوماً</h2>
                <span className="mr-auto text-xs text-slate-400">
                  {fmt(analytics.views30d.reduce((s, d) => s + d.count, 0))} زيارة إجمالاً
                </span>
              </div>
              <Views30dChart data={analytics.views30d} />
              <div className="mt-6" /> {/* space for date labels */}
            </section>

            {/* Live event feed */}
            <section className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="font-semibold text-slate-800">آخر الأحداث</h2>
              </div>
              <EventFeed events={analytics.events} />
            </section>
          </div>

          {/* ── Row: top pages + top searches ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Top pages */}
            <section className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <LayoutList className="w-4 h-4 text-blue-500" />
                <h2 className="font-semibold text-slate-800">أكثر الصفحات زيارة</h2>
                <span className="mr-auto text-xs text-slate-400">آخر 30 يوماً</span>
              </div>
              {analytics.topPages.length === 0
                ? <p className="text-sm text-slate-400 text-center py-4">لا توجد بيانات بعد</p>
                : (
                <ul className="space-y-2.5">
                  {analytics.topPages.map((p, i) => {
                    const max = analytics.topPages[0]?.count ?? 1;
                    const pct = Math.round((p.count / max) * 100);
                    // shorten path display
                    const label = p.path.length > 45 ? '…' + p.path.slice(-42) : p.path;
                    return (
                      <li key={i}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs text-slate-700 truncate max-w-[75%]" dir="ltr">{label}</span>
                          <span className="text-xs text-slate-500 font-medium">{fmt(p.count)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Top search queries */}
            <section className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-4 h-4 text-violet-500" />
                <h2 className="font-semibold text-slate-800">أكثر كلمات البحث</h2>
                <span className="mr-auto text-xs text-slate-400">آخر 30 يوماً</span>
              </div>
              {analytics.topSearches.length === 0
                ? <p className="text-sm text-slate-400 text-center py-4">لا توجد بيانات بعد</p>
                : (
                <ul className="space-y-2.5">
                  {analytics.topSearches.map((s, i) => {
                    const max = analytics.topSearches[0]?.count ?? 1;
                    const pct = Math.round((s.count / max) * 100);
                    return (
                      <li key={i}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs text-slate-700 truncate max-w-[75%]">{s.query}</span>
                          <span className="text-xs text-slate-500 font-medium">{fmt(s.count)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
