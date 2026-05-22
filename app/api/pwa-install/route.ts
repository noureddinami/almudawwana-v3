import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { device_id, platform, source } = await req.json();

    if (!device_id || !platform || !source) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }

    const supabase = createPublicClient();
    const { error } = await supabase
      .from('pwa_installs')
      .upsert({ device_id, platform, source }, { onConflict: 'device_id', ignoreDuplicates: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
}
