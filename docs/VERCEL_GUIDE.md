# Vercel Deployment Guide

## Project

- **URL**: https://almudawwana-v3.vercel.app
- **Framework**: Next.js 16 (App Router)
- **Auto-deploy**: On push to `main` branch

## Dashboard

- [Vercel Project Dashboard](https://vercel.com/) (login with your GitHub account)

## Environment Variables

Set these in **Vercel Dashboard > Settings > Environment Variables**:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://aoojpafediogwfdacqww.supabase.co` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Public |
| `SUPABASE_SERVICE_KEY` | Your Supabase service role key | Secret, server-only |
| `NEXT_PUBLIC_API_URL` | `https://almodawana.dreamhosters.com` | Legacy API (no `/api/v1`) |

Get the Supabase keys from:
- [Supabase > Settings > API](https://supabase.com/dashboard/project/aoojpafediogwfdacqww/settings/api)

## Deployment Flow

```
Push to main → Vercel webhook → Build (npm run build) → Deploy
```

Typical build time: 1-2 minutes.

## Custom Domain

To add a custom domain:

1. Go to **Vercel Dashboard > Settings > Domains**
2. Add your domain (e.g., `almudawwana.ma`)
3. Configure DNS records as instructed by Vercel
4. After domain is active, update these places in the codebase:
   - `app/layout.tsx` — `BASE_URL` constant
   - `app/page.tsx` — `BASE_URL` constant
   - `app/sitemap.ts` — base URL
   - `components/JsonLd.tsx` — `BASE_URL`
   - All pages with `generateMetadata` — canonical URLs
5. Update Supabase settings:
   - **Site URL** → new domain
   - **Redirect URLs** → add new domain callback
6. Update Google Cloud OAuth:
   - **Authorized JavaScript origins** → add new domain
   - **Authorized redirect URIs** remains the Supabase callback URL

## Build Configuration

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Node.js Version**: 20.x (or latest LTS)

## Troubleshooting

### Stale cache after deploy
The PWA service worker can serve cached JS after deployment. Users may need to:
```javascript
caches.keys().then(names => names.forEach(name => caches.delete(name)))
```

### Build failures
- Check Vercel build logs for TypeScript errors
- Ensure all env vars are set
- Run `npm run build` locally to reproduce

### API routes not working
- Verify env vars are set in Vercel dashboard
- Check function logs in Vercel dashboard
