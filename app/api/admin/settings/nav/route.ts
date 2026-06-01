import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/helpers'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/admin/settings/nav
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('id', 'nav_links')
    .single()

  if (error) return NextResponse.json({ hidden: [] })
  return NextResponse.json({ hidden: (data?.value as any)?.hidden ?? [] })
}

// PUT /api/admin/settings/nav  { hidden: string[] }
export async function PUT(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const body = await req.json()
  const hidden: string[] = Array.isArray(body.hidden) ? body.hidden : []

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('site_settings')
    .upsert(
      { id: 'nav_links', value: { hidden }, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, hidden })
}
