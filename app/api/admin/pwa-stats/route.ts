import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/helpers';

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;
  const { supabase } = authResult;

  const [totalRes, iosRes, androidRes, desktopRes, monthRes] = await Promise.all([
    supabase.from('pwa_installs').select('*', { count: 'exact', head: true }),
    supabase.from('pwa_installs').select('*', { count: 'exact', head: true }).eq('platform', 'ios'),
    supabase.from('pwa_installs').select('*', { count: 'exact', head: true }).eq('platform', 'android'),
    supabase.from('pwa_installs').select('*', { count: 'exact', head: true }).eq('platform', 'desktop'),
    supabase.from('pwa_installs').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  return NextResponse.json({
    total:   totalRes.count   ?? 0,
    ios:     iosRes.count     ?? 0,
    android: androidRes.count ?? 0,
    desktop: desktopRes.count ?? 0,
    month:   monthRes.count   ?? 0,
  });
}
