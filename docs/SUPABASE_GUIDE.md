# Supabase Database Guide

## Project

- **Project ID**: `aoojpafediogwfdacqww`
- **Dashboard**: [Supabase Dashboard](https://supabase.com/dashboard/project/aoojpafediogwfdacqww)
- **Region**: (check dashboard)

## Database Schema

### Core Tables

| Table | Description | PK |
|-------|-------------|-----|
| `codes` | Legal codes (laws, constitutions, decrees) | UUID |
| `articles` | Individual legal articles within codes | UUID |
| `code_types` | Categories for codes (constitution, organic_law, etc.) | Auto-inc |
| `sections` | Subdivisions within a code | UUID |
| `books` | Books within a code | UUID |
| `profiles` | User profiles linked to Supabase Auth | UUID (= auth.users.id) |

### User-Generated Content

| Table | Description |
|-------|-------------|
| `commentaries` | Comments and annotations on articles |
| `discussions` | Discussion threads |
| `votes` | Upvotes/downvotes on comments |
| `bookmarks` | User bookmarks |
| `tags` | Content tags |
| `article_tags` | Article-tag relationships |

### Admin / System

| Table | Description |
|-------|-------------|
| `code_requests` | Public requests to add new codes |
| `contact_messages` | Contact form submissions (public insert, admin read) |
| `pdf_documents` | Uploaded PDFs for article extraction |
| `moderation_logs` | Admin action logs |
| `notifications` | User notifications |

### Search

| Table | Description |
|-------|-------------|
| `articles_search` | Full-text search index for articles |

## Authentication

- **Provider**: Supabase Auth (email + Google OAuth)
- **Session**: SSR cookies via `@supabase/ssr`
- **Roles**: Stored in `profiles.role` — `user`, `moderator`, `admin`
- **Status**: `profiles.status` — `active`, `suspended`, etc.

## Row Level Security (RLS)

All tables have RLS enabled. Key policies:

### `contact_messages`
- **INSERT**: Anyone (public form)
- **SELECT/UPDATE**: Authenticated users only (admin dashboard)

### `code_requests`
- **INSERT**: Anyone (via service key in API route)
- **SELECT/UPDATE**: Authenticated admins

### `codes` / `articles`
- **SELECT**: Public (anon key)
- **INSERT/UPDATE/DELETE**: Authenticated admins

## API Keys

Get from [Settings > API](https://supabase.com/dashboard/project/aoojpafediogwfdacqww/settings/api):

- **anon key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`): Public, respects RLS
- **service_role key** (`SUPABASE_SERVICE_KEY`): Bypasses RLS, server-only

## Client Libraries

```typescript
// Browser client (client components)
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// Server client with cookies (API routes, auth)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Public client without cookies (SSR pages, read-only)
import { createPublicClient } from '@/lib/supabase/server'
const supabase = createPublicClient()

// Service client (bypasses RLS, admin operations)
import { createServiceClient } from '@/lib/supabase/server'
const supabase = createServiceClient()
```

## Running Migrations

Migrations are stored in `supabase/migrations/`. To run them:

1. Go to [SQL Editor](https://supabase.com/dashboard/project/aoojpafediogwfdacqww/sql/new)
2. Paste the SQL from the migration file
3. Click **Run**

Or use the Management API via browser console (as documented in migration files).

## Backups

- Supabase Free tier: daily backups (7-day retention)
- For manual backup: use `pg_dump` via Supabase connection string

## URL Configuration (Auth)

- **Site URL**: `https://almudawwana-v3.vercel.app`
- **Redirect URLs**:
  - `https://almudawwana-v3.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

## Useful SQL Queries

```sql
-- Count articles per code
SELECT c.title_ar, COUNT(a.id) as article_count
FROM codes c LEFT JOIN articles a ON a.code_id = c.id
GROUP BY c.id, c.title_ar ORDER BY article_count DESC;

-- Check recent contact messages
SELECT name, email, subject, status, created_at
FROM contact_messages ORDER BY created_at DESC LIMIT 20;

-- Check code requests
SELECT code_title, name, status, created_at
FROM code_requests ORDER BY created_at DESC LIMIT 20;

-- Update total_articles count for all codes
UPDATE codes SET total_articles = (
  SELECT COUNT(*) FROM articles WHERE articles.code_id = codes.id
);
```
