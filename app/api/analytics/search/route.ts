import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, results_count, search_type, code_slug, device_id } = body;
    if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 });

    const supabase = createServiceClient();
    await supabase.from('search_logs').insert({
      query:         query.slice(0, 500),
      results_count: results_count ?? 0,
      search_type:   search_type ?? 'text',
      code_slug:     code_slug ?? null,
      device_id:     device_id ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
