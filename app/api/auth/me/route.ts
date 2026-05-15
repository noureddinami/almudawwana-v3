import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/supabase/helpers'

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase, userId } = authResult

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, full_name_ar, email, username, avatar_url, role, status, karma_points, auth_provider')
    .eq('id', userId)
    .single()

  if (error || !profile) return NextResponse.json({ message: 'الحساب غير موجود' }, { status: 404 })

  return NextResponse.json({
    user: { ...profile, provider: profile.auth_provider },
  })
}
