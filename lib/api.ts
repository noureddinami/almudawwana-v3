// ── Client API public ─────────────────────────────────────────────────────────
// Appelle les Next.js API Routes (/api/*) — plus de proxy DreamHost.

export interface Code {
  id: string
  slug: string
  title_ar: string
  title_fr: string | null
  type: string
  status: string
  official_number: string | null
  total_articles: number
  promulgation_date: string | null
  books?: { id: string; number: string; title_ar: string; title_fr: string }[]
  sections?: { id: string; number: string; title_ar: string; children?: any[] }[]
}

export interface Comment {
  id: string
  content_ar: string
  upvotes: number
  created_at: string
  author?: { full_name: string | null }
}

export interface AdminNote {
  id: string
  content_ar: string
  created_at: string
  author?: { full_name: string | null }
}

export interface RecentNote {
  id: string
  content_ar: string
  created_at: string
  article?: {
    id: string; slug: string; number: string
    code?: { slug: string; title_ar: string }
  }
}

export interface Article {
  id: string
  code_id: string
  section_id: string | null
  number: string
  number_int: number | null
  slug: string
  content_ar: string
  content_fr: string | null
  status: string
  view_count: number
  comment_count: number
  section: null | { id: string; title_ar: string; number: string }
  code?: Pick<Code, 'id' | 'slug' | 'title_ar'>
  tags?: { id: string; name_ar: string; slug: string }[]
  admin_notes?: AdminNote[]
}

export interface PdfDoc {
  id: string
  title_ar: string
  title_fr: string | null
  document_type: string
  file_size: number
  file_size_human: string
  articles_extracted: number
  source_url: string | null
  created_at: string
}

export interface User {
  id: string
  full_name: string | null
  email: string
  role: string
  status: string
  avatar_url: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  total: number
  per_page: number
  from: number
  to: number
}

export interface SearchResponse {
  query: string
  results: PaginatedResponse<Article & { code?: Pick<Code, 'id' | 'slug' | 'title_ar'> }>
}

// Conservé pour compatibilité (utilisé dans login/register pour Google OAuth)
export const API_BASE = '/api'

// ── Auth helpers (localStorage) ───────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('mudawwana_token')
}

export function saveToken(token: string) {
  localStorage.setItem('mudawwana_token', token)
}

export function saveUser(user: User) {
  localStorage.setItem('mudawwana_user', JSON.stringify(user))
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null
  const user = localStorage.getItem('mudawwana_user')
  return user ? JSON.parse(user) : null
}

export function clearToken() {
  localStorage.removeItem('mudawwana_token')
  localStorage.removeItem('mudawwana_user')
}

export function hasToken(): boolean {
  return !!getToken()
}

// ── Fetch centralisé ─────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  const data = await res.json()

  if (!res.ok) {
    const errors = data?.errors as Record<string, string[]> | undefined
    const firstError = errors ? Object.values(errors)[0]?.[0] : undefined
    throw new Error(data?.message ?? firstError ?? 'Erreur inconnue')
  }

  return data as T
}

// ── Notes publiques ───────────────────────────────────────────────────────────

export const notes = {
  recent: () => apiFetch<RecentNote[]>('/notes/recent'),
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (full_name: string, email: string, password: string) =>
    apiFetch<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password, password_confirmation: password }),
    }),

  logout: () =>
    apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),

  me: () => apiFetch<{ user: User }>('/auth/me'),

  verifyPassword: (password: string) =>
    apiFetch<{ verified: boolean }>('/auth/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
}

// ── Codes ─────────────────────────────────────────────────────────────────────

export const codes = {
  list:    (page = 1, perPage = 20) =>
    apiFetch<PaginatedResponse<Code>>(`/codes?page=${page}&per_page=${perPage}`),

  listAll: () =>
    apiFetch<PaginatedResponse<Code>>('/codes?page=1&per_page=200'),

  latest:  (n = 3) =>
    apiFetch<PaginatedResponse<Code>>(`/codes?sort=latest&per_page=${n}`),

  get:     (slug: string) =>
    apiFetch<Code>(`/codes/${slug}`),

  articles: (slug: string, page = 1, perPage = 20) =>
    apiFetch<PaginatedResponse<Article>>(`/codes/${slug}/articles?page=${page}&per_page=${perPage}`),

  pdfs: async (_slug: string) => [] as PdfDoc[], // à implémenter si besoin
}

// ── Articles ──────────────────────────────────────────────────────────────────

export const articles = {
  get: (slug: string) =>
    apiFetch<Article>(`/articles/${slug}`),

  search: async (q: string, page = 1, perPage = 20, code?: string) => {
    const codeParam = code ? `&code=${encodeURIComponent(code)}` : ''
    const r = await apiFetch<SearchResponse>(
      `/search?q=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}${codeParam}`
    )
    return r.results
  },

  searchKeywords: async (kw: string, page = 1, perPage = 20, code?: string) => {
    const codeParam = code ? `&code=${encodeURIComponent(code)}` : ''
    const r = await apiFetch<SearchResponse>(
      `/search?kw=${encodeURIComponent(kw)}&page=${page}&per_page=${perPage}${codeParam}`
    )
    return r.results
  },

  comments: {
    list: (articleSlug: string) =>
      apiFetch<Comment[]>(`/articles/${encodeURIComponent(articleSlug)}/comments`),

    create: (articleSlug: string, content_ar: string) =>
      apiFetch<{ message: string }>(`/articles/${encodeURIComponent(articleSlug)}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content_ar }),
      }),
  },
}
