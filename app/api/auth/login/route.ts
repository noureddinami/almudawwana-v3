import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ message: 'البريد وكلمة المرور مطلوبان' }, { status: 422 })
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ message: 'بيانات الدخول غير صحيحة' }, { status: 401 })
  }

  // Vérifier le statut du profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, full_name_ar, email, username, avatar_url, role, status, karma_points, auth_provider')
    .eq('id', data.user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ message: 'الحساب غير موجود' }, { status: 404 })
  }

  if (['suspended', 'banned'].includes(profile.status)) {
    await supabase.auth.signOut()
    return NextResponse.json({ message: 'تم تعليق حسابك' }, { status: 403 })
  }

  // Mettre à jour last_login_at
  await supabase
    .from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', data.user.id)

  return NextResponse.json({
    token: data.session.access_token,
    user: {
      ...profile,
      avatar_url: profile.avatar_url,
      provider: profile.auth_provider,
    },
  })
}
