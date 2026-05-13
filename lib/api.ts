// ── Client API centralisé ────────────────────────────────────────────────────
// Uses api-proxy.php workaround for DreamHost (mod_rewrite not available)
// Falls back to /api/v1 for local development

// Determine API URL based on environment
// In production (Vercel): use DreamHost by default unless NEXT_PUBLIC_API_URL is set
// In development (localhost): use local API
const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('vercel');
const defaultUrl = isProduction
  ? 'https://almodawana.dreamhosters.com/api/v1'  // Production default
  : 'http://127.0.0.1:8000/api/v1';                // Development default

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? defaultUrl;
export const PROXY_ENABLED = API_BASE.includes('dreamhosters.com') || API_BASE.includes('api-proxy.php');
export const PROXY_URL = PROXY_ENABLED
  ? API_BASE.replace('/api/v1', '/api-proxy.php')
  : null;

// ── Types ────────────────────────────────────────────────────────────────────

export interface Code {
  id: string;
  slug: string;
  title_ar: string;
  title_fr: string | null;
  type: string;
  status: string;
  official_number: string | null;
  total_articles: number;
  promulgation_date: string | null;
  // Extra fields from show()
  books?: { id: string; number: string; title_ar: string; title_fr: string }[];
  sections?: { id: string; number: string; title_ar: string; children?: any[] }[];
}

export interface Comment {
  id: string;
  content_ar: string;
  upvotes: number;
  created_at: string;
  author?: { full_name: string | null };
}

export interface AdminNote {
  id: string;
  content_ar: string;
  created_at: string;
  author?: { full_name: string | null };
}

export interface RecentNote {
  id: string;
  content_ar: string;
  created_at: string;
  article?: {
    id: string;
    slug: string;
    number: string;
    code?: { slug: string; title_ar: string };
  };
}

export interface Article {
  id: string;
  code_id: string;
  section_id: string | null;
  number: string;
  number_int: number | null;
  slug: string;
  content_ar: string;
  content_fr: string | null;
  status: string;
  view_count: number;
  comment_count: number;
  section: null | { id: string; title_ar: string; number: string };
  code?: Pick<Code, 'id' | 'slug' | 'title_ar'>;
  tags?: { id: string; name_ar: string; slug: string }[];
  admin_notes?: AdminNote[];
}

export interface PdfDoc {
  id: string;
  title_ar: string;
  title_fr: string | null;
  document_type: string;
  file_size: number;
  file_size_human: string;
  articles_extracted: number;
  source_url: string | null;   // lien officiel public (sgg.gov.ma, adala…)
  created_at: string;
}

export interface User {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  status: string;
  avatar_url: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
  from: number;
  to: number;
}

export interface SearchResponse {
  query: string;
  results: PaginatedResponse<Article & { code?: Pick<Code, 'id' | 'slug' | 'title_ar'> }>;
}

// ── Helper fetch ─────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mudawwana_token');
}

/**
 * Translates API path to proxy URL when using the proxy
 * Examples:
 *   /codes -> api-proxy.php?endpoint=codes
 *   /codes?page=1 -> api-proxy.php?endpoint=codes&page=1
 *   /codes/legal-code -> api-proxy.php?endpoint=codes&slug=legal-code
 *   /codes/legal-code/articles -> api-proxy.php?endpoint=codes&slug=legal-code&sub=articles
 *   /articles/article-1 -> api-proxy.php?endpoint=articles&slug=article-1
 */
function pathToProxyUrl(path: string): string {
  const [pathPart, queryPart] = path.split('?');
  const pathSegments = pathPart.split('/').filter(Boolean);

  if (!pathSegments.length) return path;

  // Determine endpoint from path
  let endpoint = '';
  let slug = '';
  let subResource = '';

  if (pathSegments[0] === 'codes') {
    endpoint = 'codes';
    if (pathSegments[1]) {
      slug = pathSegments[1];
      // Check if there's a sub-resource like /articles or /pdfs
      if (pathSegments[2] && ['articles', 'pdfs'].includes(pathSegments[2])) {
        subResource = pathSegments[2];
      }
    }
  } else if (pathSegments[0] === 'articles') {
    endpoint = 'articles';
    if (pathSegments[1]) {
      slug = pathSegments[1];
    }
  } else if (pathSegments[0] === 'books') {
    endpoint = 'books';
    if (pathSegments[1]) {
      slug = pathSegments[1];
    }
  } else {
    // Not a proxy-supported endpoint
    return path;
  }

  // Build proxy URL
  let proxyPath = `${PROXY_URL}?endpoint=${endpoint}`;
  if (slug) proxyPath += `&slug=${encodeURIComponent(slug)}`;
  if (subResource) proxyPath += `&sub=${encodeURIComponent(subResource)}`;
  if (queryPart) proxyPath += `&${queryPart}`;

  return proxyPath;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  // Determine URL: use proxy for supported endpoints, regular API for others
  let url = path;
  if (PROXY_ENABLED && (path.startsWith('/codes') || path.startsWith('/articles') || path.startsWith('/books'))) {
    url = pathToProxyUrl(path);
  } else {
    url = `${API_BASE}${path}`;
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const errors = data?.errors as Record<string, string[]> | undefined;
    const firstError = errors ? Object.values(errors)[0]?.[0] : undefined;
    const msg = data?.message ?? firstError ?? 'Erreur inconnue';
    throw new Error(msg);
  }

  return data as T;
}

// ── Notes publiques ──────────────────────────────────────────────────────────

export const notes = {
  recent: () => apiFetch<RecentNote[]>('/notes/recent'),
};

// ── Auth ─────────────────────────────────────────────────────────────────────

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

  verifyPassword: (password: string) =>
    apiFetch<{ verified: boolean }>('/auth/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  me: () => apiFetch<{ user: User }>('/me'),
};

// ── Codes ────────────────────────────────────────────────────────────────────

export const codes = {
  list: (page = 1, perPage = 20) =>
    apiFetch<PaginatedResponse<Code>>(`/codes?page=${page}&per_page=${perPage}`),

  listAll: () =>
    apiFetch<PaginatedResponse<Code>>('/codes?page=1&per_page=200'),

  latest: (n = 3) =>
    apiFetch<PaginatedResponse<Code>>(`/codes?sort=latest&per_page=${n}`),

  get: (slug: string) =>
    apiFetch<Code>(`/codes/${slug}`),

  articles: (slug: string, page = 1, perPage = 20) =>
    apiFetch<PaginatedResponse<Article>>(
      `/codes/${slug}/articles?page=${page}&per_page=${perPage}`
    ),

  pdfs: async (slug: string) => {
    const r = await apiFetch<{ code: Code; pdfs: PdfDoc[] }>(`/codes/${slug}/pdfs`);
    return r.pdfs ?? [];
  },
};

// ── Articles ─────────────────────────────────────────────────────────────────

export const articles = {
  get: (slug: string) =>
    apiFetch<Article>(`/articles/${slug}`),

  search: async (q: string, page = 1, perPage = 20, code?: string) => {
    const codeParam = code ? `&code=${encodeURIComponent(code)}` : '';
    const r = await apiFetch<SearchResponse>(
      `/search?q=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}${codeParam}`
    );
    return r.results;
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

  searchKeywords: async (kw: string, page = 1, perPage = 20, code?: string) => {
    const codeParam = code ? `&code=${encodeURIComponent(code)}` : '';
    const r = await apiFetch<SearchResponse>(
      `/search?kw=${encodeURIComponent(kw)}&page=${page}&per_page=${perPage}${codeParam}`
    );
    return r.results;
  },
};

// ── Auth helpers (localStorage) ───────────────────────────────────────────────

export function saveToken(token: string) {
  localStorage.setItem('mudawwana_token', token);
}
export function clearToken() {
  localStorage.removeItem('mudawwana_token');
}
export function hasToken(): boolean {
  return !!getToken();
}
