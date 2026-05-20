import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const VALID_REASONS = [
  'spelling_error',
  'outdated',
  'numbering_error',
  'incomplete',
  'conflict',
  'other',
]

export async function POST(req: NextRequest) {
  try {
    const { article_id, reason, description } = await req.json()

    if (!article_id || !reason) {
      return NextResponse.json({ error: 'article_id و reason مطلوبان' }, { status: 400 })
    }

    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'سبب غير صالح' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase.from('article_reports').insert({
      article_id,
      reason,
      description: description?.trim() || null,
      status: 'pending',
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
