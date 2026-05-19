import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /auth/callback — Supabase OAuth callback
 * Exchanges the auth code for a session, upserts the profile, then redirects.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !session) {
    console.error('OAuth code exchange error:', error)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Upsert profile on first Google sign-in
  const user = session.user
  const meta = user.user_metadata ?? {}

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email!,
      full_name: meta.full_name ?? meta.name ?? null,
      google_id: meta.provider_id ?? meta.sub ?? null,
      google_avatar: meta.avatar_url ?? meta.picture ?? null,
      avatar_url: meta.avatar_url ?? meta.picture ?? null,
      auth_provider: 'google',
    }, { onConflict: 'id', ignoreDuplicates: false })

  if (profileError) {
    console.error('Profile upsert error:', profileError)
    // Non-blocking — user is still authenticated
  }

  return NextResponse.redirect(`${origin}${next}`)
}
