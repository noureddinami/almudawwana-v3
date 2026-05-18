# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project Overview

**Al-Mudawwana** (المدوّنة) is a Moroccan legal encyclopedia PWA — a bilingual (Arabic/French) platform for browsing, searching, and managing Moroccan legal codes and articles. The project consists of two separate repositories sharing one parent directory:

- **almudawwana-web** (this repo) — Next.js 16 frontend, deployed on Vercel
- **almudawwana-api** (sibling repo) — Laravel PHP backend + standalone `api-proxy.php`, deployed on DreamHost

## Commands

```bash
# Frontend (almudawwana-web)
npm run dev          # Start Next.js dev server (port 3000)
npm run build        # Production build
npm run start        # Serve production build locally
npm run generate:icons  # Generate PWA icons from icon.svg

# Backend (almudawwana-api) — Laravel
php artisan serve    # Start Laravel dev server (port 8000)
php artisan migrate  # Run database migrations
```

## Architecture

### Database: Supabase

The project uses **Supabase** (PostgreSQL) as its primary database:

- **Supabase project ID:** `aoojpafediogwfdacqww`
- **Client libraries:** `@supabase/supabase-js` + `@supabase/ssr`
- **Server client:** `lib/supabase/server.ts` — `createClient()` (authenticated) and `createPublicClient()` (anon)
- **Helpers:** `lib/supabase/helpers.ts` — pagination, auth guards, slugify, uniqueSlug, apiError
- **API routes** use Supabase directly (no external API proxy needed for Supabase-backed pages)
- **Environment vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`

### Dual-API Pattern (Legacy + Supabase)

The frontend has **two API layers**:

| Layer | Used by | Backend |
|-------|---------|---------|
| `lib/supabase/server.ts` | Server components, API routes, SSR pages | Supabase (PostgreSQL) |
| `lib/api.ts` / `lib/adminApi.ts` | Some client components (legacy) | DreamHost api-proxy.php → MySQL |

**New features should use Supabase directly.** The legacy API proxy (`api-proxy.php`) is kept for backward compatibility.

### Proxy Architecture (Legacy)

DreamHost shared hosting cannot use `mod_rewrite`, so legacy API requests go through `api-proxy.php`:

```
Frontend (Vercel) → api-proxy.php (DreamHost) → MySQL database
```

- `api-proxy.php` is a standalone PHP file (not part of Laravel) that directly queries the database
- Path translation: `/admin/codes?page=1` → `api-proxy.php?endpoint=admin&slug=codes&page=1`

### DreamHost Authorization Header Workaround

**DreamHost strips the `Authorization` header.** The workaround:

1. Frontend appends `&token=<jwt>` as a query parameter for protected endpoints
2. Backend checks: `getallheaders()` → `$_SERVER['HTTP_AUTHORIZATION']` → `$_SERVER['REDIRECT_HTTP_AUTHORIZATION']` → `$_GET['token']` → `$_SESSION['token']`

### Authentication

- **Supabase Auth** for new auth flows (SSR cookies via `@supabase/ssr`)
- **Legacy token:** base64-encoded JSON `{user_id, email, role, created_at, nonce}` in `localStorage`
- Admin guard: `requireAdmin()` in `lib/supabase/helpers.ts` checks `profiles.role` + `profiles.status`

### URL Structure & Slugs

Public URLs use **Arabic slugs**, not UUIDs:

```
/codes                              → List all legal codes
/codes/{slug-arabe}                 → Single code (e.g., /codes/المسطرة-الجنائية)
/codes/{slug-arabe}/المادة-{number} → Single article (e.g., /codes/المسطرة-الجنائية/المادة-1)
/search                             → Full-text search
```

**⚠️ Slugify rules (CRITICAL):**
- `slugify()` in `lib/supabase/helpers.ts` and `autoSlug()` in `app/admin/codes/page.tsx`
- **Do NOT use `normalize('NFD')`** — it breaks Arabic hamza letters (ئ, أ, إ, ؤ)
- Only strip tashkeel diacritics (U+064B to U+065F range)
- Keep Arabic letters (ء-ي), Latin letters (a-z), and digits
- Spaces/special chars → hyphens

### Frontend Structure

```
app/
  page.tsx                              # Homepage (hero, search, stats) — SSR
  login/page.tsx                        # Login form (client)
  login/layout.tsx                      # noindex metadata
  register/page.tsx                     # Registration (client)
  register/layout.tsx                   # noindex metadata
  search/page.tsx                       # Full-text search — SSR
  codes/page.tsx                        # List all legal codes — SSR
  codes/[slug]/page.tsx                 # Single code with article list — SSR
  codes/[slug]/[articleSlug]/page.tsx   # Single article view — SSR
  contact/page.tsx                      # Contact form
  contact/layout.tsx                    # SEO metadata
  request-code/page.tsx                 # Request new code form
  request-code/layout.tsx               # SEO metadata
  auth/callback/page.tsx                # OAuth callback
  sitemap.ts                            # Dynamic sitemap from Supabase
  admin/
    layout.tsx                          # Admin shell (sidebar, auth guard)
    page.tsx                            # Dashboard (stats cards, charts)
    codes/page.tsx                      # CRUD codes (with slug auto-generation)
    code-types/page.tsx                 # Manage code type categories
    articles/page.tsx                   # CRUD articles
    users/page.tsx                      # User management
    comments/page.tsx                   # Comment moderation
    pdfs/page.tsx                       # PDF upload & article extraction
  api/
    admin/
      codes/route.ts                    # API: CRUD codes (Supabase)
      codes/[id]/route.ts              # API: single code operations
      migrate-slugs/route.ts           # One-time slug migration endpoint
      ...

lib/
  api.ts                                # Legacy public API client (apiFetch)
  adminApi.ts                           # Legacy admin API client (adminFetch)
  supabase/
    server.ts                           # Supabase server client (createClient, createPublicClient)
    client.ts                           # Supabase browser client
    helpers.ts                          # Pagination, auth guards, slugify, apiError

components/
  Navbar.tsx                            # Top navigation bar (RTL)
  Footer.tsx                            # Site footer
  ArticlesList.tsx                      # Paginated article list
  CommentsSection.tsx                   # Article comments
  JsonLd.tsx                            # SEO structured data components
  HomeSectionNav.tsx                    # Homepage section navigation
  ConfirmDeleteModal.tsx                # Reusable delete confirmation
  CacheHydrator.tsx                     # Client cache hydration from SSR data

public/
  robots.txt                            # Blocks /admin, /api, /auth, /login, /register
  manifest.json                         # PWA manifest
  sw.js                                 # Service worker (next-pwa)
```

### SEO Implementation

Full SEO is implemented across all public pages:

- **Metadata:** `generateMetadata` on dynamic pages, static `metadata` export on others
- **Title template:** `'%s | المدوّنة'` (set in `app/layout.tsx`)
- **BASE_URL:** `https://almudawwana-v3.vercel.app` — hardcoded in metadata/JSON-LD (update when custom domain is set)
- **Open Graph / Twitter Cards:** On all public pages (`summary_large_image`)
- **JSON-LD** (`components/JsonLd.tsx`):
  - `OrganizationJsonLd` — Organization + WebSite + SearchAction (layout)
  - `BreadcrumbJsonLd` — Breadcrumbs on codes, articles, search
  - `LegislationJsonLd` — Legal code metadata (code detail page)
  - `LegalArticleJsonLd` — Legal article metadata (article page)
  - `CollectionPageJsonLd` — ItemList on codes list page
- **Sitemap:** `app/sitemap.ts` — dynamic from Supabase (codes + articles)
- **robots.txt:** Blocks admin/auth/API routes
- **middleware.ts:** Adds `X-Robots-Tag: noindex, nofollow` on admin/API/auth routes
- **Canonical URLs:** Set on all public pages via `alternates.canonical`
- **hreflang:** `ar-MA` + `x-default` (in layout)
- **noindex:** Login, register pages

**⚠️ When changing domain:** Update `BASE_URL` in `app/layout.tsx`, `app/page.tsx`, `app/sitemap.ts`, `components/JsonLd.tsx`, and all pages with `generateMetadata`.

### Environment Variables

| Variable | Dev default | Production (Vercel) |
|----------|-------------|---------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Same |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Same |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Set in Vercel dashboard |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | `https://almodawana.dreamhosters.com` |

**Important:** `NEXT_PUBLIC_API_URL` must NOT include `/api/v1` — the proxy appends paths automatically.

### Deployment

- **Frontend:** Auto-deploys to Vercel on push to `main` branch
- **Backend:** Auto-deploys to DreamHost via GitHub webhook (`deploy.php` runs `git pull`)
- **Env vars:** Production env vars are set in Vercel dashboard (not in `.env.production` which is gitignored)

## Key Conventions

- **RTL layout:** All UI is right-to-left Arabic. Use `dir="rtl"` and Tailwind RTL utilities
- **Arabic fonts:** Amiri (article text), Noto Naskh Arabic (UI), Reem Kufi (logos/headings) — via CSS variables `--font-amiri`, `--font-naskh`, `--font-kufi`
- **Icons:** Lucide React exclusively
- **Toasts:** `react-hot-toast` for notifications
- **No test suite** currently configured
- **SSR pages** use `createPublicClient()` from Supabase for data fetching
- **Admin pages** are client components (`'use client'`)
- **PWA:** Service worker via `next-pwa`, caches API responses (NetworkFirst) and static assets (CacheFirst). Cache can cause stale JS after deployment — clear with `caches.keys().then(names => names.forEach(name => caches.delete(name)))`
- **Middleware deprecation:** Next.js 16 deprecated `middleware.ts` in favor of `proxy`, but it still works (shows as "ƒ Proxy (Middleware)" in build)
