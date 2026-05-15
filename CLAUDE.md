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

### Dual-API Pattern (Critical)

The frontend has **two separate API modules** — this is the most important architectural detail:

| Module | File | Used by | Purpose |
|--------|------|---------|---------|
| `lib/api.ts` | `apiFetch()` | Public pages, auth, `/me` | Public endpoints (codes, articles, search, auth) |
| `lib/adminApi.ts` | `adminFetch()` | All `/admin/*` pages | Admin CRUD (stats, users, codes, articles, comments, PDFs) |

**Both modules must be updated in sync** when changing fetch logic, headers, or proxy behavior.

### Proxy Architecture

DreamHost shared hosting cannot use `mod_rewrite`, so all API requests go through `api-proxy.php`:

```
Frontend (Vercel) → api-proxy.php (DreamHost) → MySQL database
```

- `api-proxy.php` is a standalone PHP file (not part of Laravel) that directly queries the database
- It handles CORS, authentication, routing, and pagination independently
- Path translation: `/admin/codes?page=1` → `api-proxy.php?endpoint=admin&slug=codes&page=1`
- The proxy is used when `PROXY_ENABLED` is true (detects `dreamhosters.com` or `:8080` in API_BASE)

### DreamHost Authorization Header Workaround

**DreamHost strips the `Authorization` header** from requests before they reach PHP. The workaround:

1. Frontend appends `&token=<jwt>` as a query parameter for protected endpoints (`/admin/*`, `/me`)
2. Backend (`api-proxy.php`) checks multiple sources in order:
   - `getallheaders()` → `$_SERVER['HTTP_AUTHORIZATION']` → `$_SERVER['REDIRECT_HTTP_AUTHORIZATION']` → `$_GET['token']` → `$_SESSION['token']`

### Authentication

- Token format: base64-encoded JSON containing `{user_id, email, role, created_at, nonce}`
- Stored in `localStorage` as `mudawwana_token`, user object as `mudawwana_user`
- Login restricted to users with `role = 'admin'` and `status = 'active'`
- No JWT library — token is simply base64-decoded and validated against the database

### Frontend Structure

```
app/
  page.tsx                    # Homepage (hero, search, stats)
  login/page.tsx              # Login form
  register/page.tsx           # Registration
  search/page.tsx             # Full-text search
  codes/page.tsx              # List all legal codes
  codes/[slug]/page.tsx       # Single code with article list
  codes/[slug]/articles/[number]/page.tsx  # Single article view
  contact/page.tsx            # Contact form
  admin/
    layout.tsx                # Admin shell (sidebar, auth guard)
    page.tsx                  # Dashboard (stats cards, charts)
    codes/page.tsx            # CRUD codes
    code-types/page.tsx       # Manage code type categories
    articles/page.tsx         # CRUD articles
    users/page.tsx            # User management
    comments/page.tsx         # Comment moderation
    pdfs/page.tsx             # PDF upload & article extraction

lib/
  api.ts                      # Public API client (apiFetch + pathToProxyUrl)
  adminApi.ts                 # Admin API client (adminFetch)

components/
  Navbar.tsx                  # Top navigation bar
  Footer.tsx                  # Site footer
  ArticlesList.tsx            # Paginated article list
  CommentsSection.tsx         # Article comments
  HomeSectionNav.tsx          # Homepage section navigation
  ConfirmDeleteModal.tsx      # Reusable delete confirmation
```

### Environment Variables

| Variable | Dev default | Production (Vercel) |
|----------|-------------|---------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | `https://almodawana.dreamhosters.com` |

**Important:** Production URL must NOT include `/api/v1` — the proxy appends paths automatically. Including it causes double-path bugs like `/api/v1/api-proxy.php`.

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
- **All pages are client components** (`'use client'`) — no SSR data fetching
- **PWA:** Service worker via `next-pwa`, caches API responses (NetworkFirst) and static assets (CacheFirst). Service worker cache can cause stale JS after deployment — clear with `caches.keys().then(names => names.forEach(name => caches.delete(name)))`
