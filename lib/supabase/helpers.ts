import { SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from './server'

// ── Pagination ────────────────────────────────────────────────────────────────

export function paginationRange(page: number, perPage: number) {
  const from = (page - 1) * perPage
  const to   = from + perPage - 1
  return { from, to }
}

export function paginatedResponse<T>(
  data: T[],
  count: number,
  page: number,
  perPage: number
) {
  const lastPage = Math.ceil(count / perPage)
  const from     = (page - 1) * perPage + 1
  const to       = Math.min(page * perPage, count)
  return { data, current_page: page, last_page: lastPage, total: count, per_page: perPage, from, to }
}

// ── Auth guards ───────────────────────────────────────────────────────────────

export async function getAuthUser(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function requireAuth(
  req: NextRequest
): Promise<{ supabase: SupabaseClient; userId: string } | NextResponse> {
  const supabase = await createClient()
  const user = await getAuthUser(supabase)
  if (!user) {
    return NextResponse.json({ message: 'غير مصرح به' }, { status: 401 })
  }
  return { supabase, userId: user.id }
}

export async function requireAdmin(
  req: NextRequest
): Promise<{ supabase: SupabaseClient; userId: string; role: string } | NextResponse> {
  const supabase = await createClient()
  const user = await getAuthUser(supabase)
  if (!user) {
    return NextResponse.json({ message: 'غير مصرح به' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'moderator'].includes(profile.role) || profile.status !== 'active') {
    return NextResponse.json({ message: 'ممنوع — صلاحيات غير كافية' }, { status: 403 })
  }

  return { supabase, userId: user.id, role: profile.role }
}

// ── Slug ──────────────────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // diacritiques latin
    .replace(/[؀-ۿ]/g, c => c) // garder l'arabe (pour les slugs arabes)
    .replace(/[^a-z0-9؀-ۿ]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'item'
}

export async function uniqueSlug(
  supabase: SupabaseClient,
  table: string,
  base: string
): Promise<string> {
  let slug = slugify(base)
  let i = 2
  while (true) {
    const { data } = await supabase.from(table).select('slug').eq('slug', slug).maybeSingle()
    if (!data) return slug
    slug = slugify(base) + '-' + i++
  }
}

// ── Erreurs ───────────────────────────────────────────────────────────────────

export function apiError(message: string, status = 500) {
  return NextResponse.json({ message }, { status })
}
