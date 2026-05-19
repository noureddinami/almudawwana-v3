# GitHub Repository Guide

## Repository

- **Frontend**: [noureddinami/almudawwana-v3](https://github.com/noureddinami/almudawwana-v3)
- **Backend (legacy)**: separate repo for Laravel API

## Branch Strategy

- `main` — production branch, auto-deploys to Vercel
- Feature branches — create from `main`, merge via PR

## Workflow

```bash
# Clone the repo
git clone https://github.com/noureddinami/almudawwana-v3.git
cd almudawwana-v3

# Install dependencies
npm install

# Start dev server
npm run dev
```

## Environment Variables

Create `.env.local` at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://aoojpafediogwfdacqww.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Get the Supabase keys from:
- [Supabase Dashboard > Settings > API](https://supabase.com/dashboard/project/aoojpafediogwfdacqww/settings/api)

## Deployment

Pushing to `main` triggers auto-deployment on Vercel:

```bash
git add .
git commit -m "feat: description of changes"
git push origin main
```

Vercel builds and deploys automatically (typically takes 1-2 minutes).

## Key Conventions

- **Commit messages**: Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`)
- **Arabic slugs**: Never use `normalize('NFD')` in slug generation (breaks hamza letters)
- **RTL**: All UI is right-to-left Arabic
- **Supabase first**: New features should use Supabase directly, not the legacy API

## Important Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | AI assistant instructions |
| `app/layout.tsx` | Root layout, fonts, metadata template |
| `lib/supabase/server.ts` | Supabase server clients |
| `lib/supabase/helpers.ts` | Shared utilities (slugify, auth guards) |
| `components/Navbar.tsx` | Main navigation |
| `app/sitemap.ts` | Dynamic sitemap for SEO |
| `public/robots.txt` | Search engine directives |

## Secrets & Security

- Never commit `.env.local` or `.env.production`
- Supabase service key (`SUPABASE_SERVICE_KEY`) must only be used server-side
- Production env vars are set in [Vercel Dashboard](https://vercel.com/)
