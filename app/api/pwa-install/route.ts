import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { device_id, platform, source } = await req.json();

    if (!device_id || !platform || !source) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('pwa_installs')
      .insert({ device_id, platform, source });

    // Ignore unique constraint violation (device already tracked)
    if (error && !error.message.includes('unique') && !error.code?.includes('23505')) {
      console.error('[pwa-install]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[pwa-install] catch:', e?.message);
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
}
