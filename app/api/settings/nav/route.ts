// GET /api/settings/nav — lecture publique (pas d'auth requise)
import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/server'

export const revalidate = 0 // toujours frais

export async function GET() {
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('id', 'nav_links')
      .single()

    const hidden: string[] = (data?.value as any)?.hidden ?? []
    return NextResponse.json({ hidden })
  } catch {
    return NextResponse.json({ hidden: [] })
  }
}
