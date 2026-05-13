// ── Admin API (Bearer token, auth:sanctum + role:admin,moderator) ─────────────

import { API_BASE, Code, Article, PaginatedResponse, User, PROXY_ENABLED, PROXY_URL } from './api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mudawwana_token');
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  // Use proxy for admin endpoints when available
  let url = `${API_BASE}/admin${path}`;
  if (PROXY_ENABLED && path.startsWith('/')) {
    // Route through proxy: /admin/codes?page=1 -> api-proxy.php?endpoint=admin&slug=codes&page=1
    const pathParts = path.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      url = `${PROXY_URL}?endpoint=admin`;
      if (pathParts[0]) {
        url += `&slug=${pathParts[0]}`;
      }
      // Add remaining path parts if any
      const remaining = pathParts.slice(1);
      if (remaining.length > 0) {
        url += `&sub=${remaining.join('/')}`;
      }
      // Add query params
      const queryIndex = path.indexOf('?');
      if (queryIndex !== -1) {
        url += `&${path.substring(queryIndex + 1)}`;
      }
    }
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const errors = data?.errors as Record<string, string[]> | undefined;
    const firstError = errors ? Object.values(errors)[0]?.[0] : undefined;
    throw new Error(data?.message ?? firstError ?? 'Erreur');
  }

  return data as T;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  users: { total: number; active: number; new_week: number; new_month: number };
  codes: { total: number; in_force: number };
  articles: { total: number; in_force: number; amended: number; abrogated: number; draft: number; total_views: number };
  comments: { total: number; pending: number; approved: number; rejected: number };
  notes: { total: number };
  top_viewed: (Pick<Article, 'id' | 'number' | 'slug' | 'view_count' | 'status'> & {
    code: Pick<Code, 'id' | 'slug' | 'title_ar'>;
  })[];
  codes_breakdown: Pick<Code, 'id' | 'title_ar' | 'slug' | 'total_articles' | 'status'>[];
  recent_users: { id: string; full_name: string | null; email: string; role: string; status: string; created_at: string }[];
  pending_comments: {
    id: string; article_id: string; author_id: string; content_ar: string; created_at: string;
    author?: { id: string; full_name: string | null; email: string };
    article?: { id: string; number: string; slug: string; code_id: string; code?: Pick<Code, 'id' | 'slug' | 'title_ar'> };
  }[];
  activity_week: { date: string; count: number }[];
}

export interface AdminUser extends User {
  username: string | null;
  auth_provider: string;
  karma_points: number;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
}

export interface AdminCode extends Code {
  official_number: string | null;
  promulgation_date: string | null;
  created_at: string;
}

export interface AdminArticle {
  id: string;
  code_id: string;
  number: string;
  number_int: number | null;
  slug: string;
  status: string;
  view_count: number;
  comment_count: number;
  created_at: string;
  code?: Pick<Code, 'id' | 'slug' | 'title_ar'>;
}

export interface UserStats {
  total: number;
  active: number;
  suspended: number;
  by_role: Record<string, number>;
  new_today: number;
  new_week: number;
}

export interface ArticleStats {
  total: number;
  in_force: number;
  abrogated: number;
  amended: number;
  by_code: { name: string; count: number }[];
}

// ── Admin API ─────────────────────────────────────────────────────────────────

export const adminStats = {
  dashboard: () => adminFetch<DashboardStats>('/stats'),
};

export const adminUsers = {
  list: (params: { q?: string; role?: string; status?: string; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.q)      qs.set('q',      params.q);
    if (params.role)   qs.set('role',   params.role);
    if (params.status) qs.set('status', params.status);
    qs.set('page', String(params.page ?? 1));
    return adminFetch<PaginatedResponse<AdminUser>>(`/users?${qs}`);
  },

  stats: () => adminFetch<UserStats>('/users/stats'),

  get: (id: string) => adminFetch<AdminUser>(`/users/${id}`),

  update: (id: string, data: { role?: string; status?: string; full_name?: string }) =>
    adminFetch<{ message: string; user: AdminUser }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  destroy: (id: string) =>
    adminFetch<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),
};

export const adminCodes = {
  list: (params: { q?: string; status?: string; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.q)      qs.set('q',      params.q);
    if (params.status) qs.set('status', params.status);
    qs.set('page', String(params.page ?? 1));
    return adminFetch<PaginatedResponse<AdminCode>>(`/codes?${qs}`);
  },

  create: (data: {
    title_ar: string; title_fr?: string; type: string;
    official_number?: string; promulgation_date?: string; status?: string;
  }) =>
    adminFetch<{ message: string; code: AdminCode }>('/codes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<AdminCode>) =>
    adminFetch<{ message: string; code: AdminCode }>(`/codes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  destroy: (id: string) =>
    adminFetch<{ message: string }>(`/codes/${id}`, { method: 'DELETE' }),
};


export const adminArticles = {
  create: (data: { code_id: string; number: string; content_ar: string; content_fr?: string; status?: string }) =>
    adminFetch<{ message: string; article: AdminArticle }>('/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: (params: { q?: string; code?: string; status?: string; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.q)      qs.set('q',      params.q);
    if (params.code)   qs.set('code',   params.code);
    if (params.status) qs.set('status', params.status);
    qs.set('page', String(params.page ?? 1));
    return adminFetch<PaginatedResponse<AdminArticle>>(`/articles?${qs}`);
  },

  stats: () => adminFetch<ArticleStats>('/articles/stats'),

  get: (id: string) => adminFetch<Article>(`/articles/${id}`),

  update: (id: string, data: { content_ar?: string; content_fr?: string; status?: string; number?: string }) =>
    adminFetch<{ message: string; article: Article }>(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  destroy: (id: string) =>
    adminFetch<{ message: string }>(`/articles/${id}`, { method: 'DELETE' }),

  bulkUpdateStatus: (ids: string[], status: string) =>
    adminFetch<{ message: string }>('/articles/bulk-status', {
      method: 'POST',
      body: JSON.stringify({ ids, status }),
    }),

  bulkDestroy: (ids: string[]) =>
    adminFetch<{ message: string }>('/articles/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
};

// ── Comments & Notes ──────────────────────────────────────────────────────────

export interface AdminComment {
  id: string;
  article_id: string;
  content_ar: string;
  type: string;
  status: string;
  rejection_reason: string | null;
  upvotes: number;
  created_at: string;
  article?: {
    id: string; number: string; slug: string;
    code?: Pick<Code, 'id' | 'slug' | 'title_ar'>;
  };
  author?: Pick<User, 'id' | 'full_name' | 'email'>;
}

export const adminComments = {
  list: (params: { status?: string; q?: string; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.q)      qs.set('q', params.q);
    qs.set('page', String(params.page ?? 1));
    return adminFetch<PaginatedResponse<AdminComment>>(`/comments?${qs}`);
  },

  update: (id: string, data: { status?: string; rejection_reason?: string }) =>
    adminFetch<{ message: string; comment: AdminComment }>(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  destroy: (id: string) =>
    adminFetch<{ message: string }>(`/comments/${id}`, { method: 'DELETE' }),
};

export interface AdminNote {
  id: string;
  content_ar: string;
  created_at: string;
  author?: { full_name: string | null };
}

export const adminNotes = {
  list: (articleId: string) =>
    adminFetch<AdminNote[]>(`/articles/${articleId}/notes`),

  create: (articleId: string, content_ar: string) =>
    adminFetch<{ message: string; note: AdminNote }>(`/articles/${articleId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content_ar }),
    }),

  destroy: (noteId: string) =>
    adminFetch<{ message: string }>(`/notes/${noteId}`, { method: 'DELETE' }),
};

// ── PDFs ──────────────────────────────────────────────────────────────────────

export interface AdminPdf {
  id: string;
  code_id: string | null;
  title_ar: string;
  title_fr: string | null;
  original_filename: string;
  stored_filename: string;
  file_size: number;
  document_type: string;
  status: 'pending' | 'processing' | 'imported' | 'failed';
  articles_extracted: number | null;
  extraction_log: string | null;
  source_url: string | null;
  is_public: boolean;
  created_at: string;
  code?: Pick<Code, 'id' | 'slug' | 'title_ar'> | null;
  uploader?: { id: string; full_name: string | null } | null;
}

export interface ExtractResult {
  message: string;
  articles_detected: number;
  articles_imported: number;
  log: string;
}

export const adminPdfs = {
  list: (page = 1) =>
    adminFetch<PaginatedResponse<AdminPdf>>(`/pdfs?page=${page}`),

  upload: (formData: FormData) =>
    adminFetch<{ message: string; pdf: AdminPdf; download_url: string }>('/pdfs', {
      method: 'POST',
      body: formData,
    }),

  get: (id: string) =>
    adminFetch<{ pdf: AdminPdf; download_url: string; file_size: string }>(`/pdfs/${id}`),

  update: (id: string, data: { title_ar?: string; title_fr?: string; code_id?: string; is_public?: boolean }) =>
    adminFetch<{ message: string; pdf: AdminPdf }>(`/pdfs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  extract: (id: string) =>
    adminFetch<ExtractResult>(`/pdfs/${id}/extract`, { method: 'POST' }),

  preview: (id: string) =>
    adminFetch<{ detected: number; sample: { type: string; number: string; content_ar: string }[]; all_numbers: string[] }>(`/pdfs/${id}/preview`, { method: 'POST' }),

  destroy: (id: string) =>
    adminFetch<{ message: string }>(`/pdfs/${id}`, { method: 'DELETE' }),
};

// ── Code Types ───────────────────────────────────────────────────────────────

export interface CodeType {
  id: number;
  slug: string;
  name_ar: string;
  name_fr: string | null;
  color: string;
  sort_order: number;
  codes_count?: number;
}

export const adminCodeTypes = {
  list: () =>
    adminFetch<CodeType[]>('/code-types'),

  create: (data: { name_ar: string; name_fr?: string; color: string; sort_order?: number }) =>
    adminFetch<CodeType>('/code-types', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number, data: Partial<{ name_ar: string; name_fr: string; color: string; sort_order: number }>) =>
    adminFetch<CodeType>(`/code-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  destroy: (id: number) =>
    adminFetch<void>(`/code-types/${id}`, { method: 'DELETE' }),
};

