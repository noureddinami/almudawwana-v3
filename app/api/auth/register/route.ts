import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()

  const { full_name, email, password } = body

  if (!full_name || !email || !password) {
    return NextResponse.json({ message: 'الاسم والبريد وكلمة المرور مطلوبة' }, { status: 422 })
  }
  if (password.length < 8) {
    return NextResponse.json({ message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 422 })
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name } },
  })

  if (error) {
    const msg = error.message.includes('already registered')
      ? 'هذا البريد مسجل مسبقاً'
      : error.message
    return NextResponse.json({ message: msg }, { status: 422 })
  }

  // Le trigger handle_new_user crée le profil — on met à jour status → active
  if (data.user) {
    await supabase
      .from('profiles')
      .update({ status: 'active', email_verified_at: new Date().toISOString() })
      .eq('id', data.user.id)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status')
    .eq('id', data.user!.id)
    .single()

  return NextResponse.json({
    message: 'تم إنشاء حسابك بنجاح.',
    token: data.session?.access_token ?? null,
    user: profile,
  }, { status: 201 })
}
