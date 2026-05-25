import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, platform, device_id, session_id } = body;
    if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 });

    const supabase = createServiceClient();
    await supabase.from('page_views').insert({
      path:       path.slice(0, 500),
      platform:   platform ?? null,
      device_id:  device_id ?? null,
      session_id: session_id ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
