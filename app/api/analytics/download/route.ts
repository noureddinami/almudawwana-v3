import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code_slug, article_id, format, device_id } = body;
    if (!code_slug) return NextResponse.json({ error: 'code_slug required' }, { status: 400 });

    const supabase = createServiceClient();
    await supabase.from('download_logs').insert({
      code_slug:  code_slug.slice(0, 500),
      article_id: article_id ?? null,
      format:     format ?? 'pdf',
      device_id:  device_id ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
