import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/supabase/helpers'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult
  const { supabase, userId } = authResult

  const { password } = await req.json()
  if (!password) return NextResponse.json({ message: 'كلمة المرور مطلوبة' }, { status: 422 })

  // Tenter une connexion avec l'email + mot de passe fourni pour vérifier
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  if (!profile) return NextResponse.json({ message: 'المستخدم غير موجود' }, { status: 404 })

  const tempClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { error } = await tempClient.auth.signInWithPassword({
    email: profile.email,
    password,
  })

  if (error) return NextResponse.json({ verified: false, message: 'كلمة المرور غير صحيحة' }, { status: 422 })

  return NextResponse.json({ verified: true })
}
