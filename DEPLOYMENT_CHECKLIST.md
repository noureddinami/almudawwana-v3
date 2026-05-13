# Al-Mudawwana v3 Deployment Checklist

## ✓ Completed Tasks

### Frontend (almudawwana-web)
- [x] Update API client to use proxy (lib/api.ts)
  - [x] Auto-detect DreamHost URLs
  - [x] Translate paths to proxy parameters
  - [x] Support pagination
- [x] Push changes to GitHub
- [x] Vercel auto-deployment triggered

### Backend (almudawwana-api)
- [x] Create api-proxy.php workaround
- [x] Support pagination and filtering
- [x] Return proper response formats
- [x] Push to GitHub and DreamHost

### Database
- [x] Seed database with legal codes
- [x] Seed database with articles

## 📋 Remaining Tasks

### 1. Configure Vercel Environment Variables
**Status**: ⏳ PENDING - NEEDS USER ACTION

Steps:
1. Go to: https://vercel.com/dashboard/noureddinami/almudawwana-web
2. Click project name
3. Go to: Settings → Environment Variables
4. Add new variable:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://almodawana.dreamhosters.com/api/v1`
   - Environments: Production
5. Redeploy project

### 2. Verify Data Appears
**Status**: ⏳ PENDING

Check:
1. Visit: https://almudawwana-web.vercel.app
2. Verify home page shows codes
3. Click on a code to see articles
4. Test search functionality (if available)

### 3. Monitor Logs
**Status**: ⏳ ON DEMAND

Check deployment logs:
- Vercel: https://vercel.com/dashboard/noureddinami/almudawwana-web/deployments
- DreamHost: Verify api-proxy.php is working
  - Test: https://almodawana.dreamhosters.com/api-proxy.php?endpoint=codes

### 4. Cleanup (Optional)
**Status**: ⏳ NOT STARTED

Remove diagnostic scripts from DreamHost:
- test-api.php
- test-api-detailed.php
- check-env.php
- check-data.php
- migrate-debug.php
- reset-and-seed.php
- And others...

## 🚀 Key Files Modified

### Frontend
- `lib/api.ts` - Proxy detection and path translation
- `.env.production` - Production API URL (local only)

### Backend
- `api-proxy.php` - Enhanced with pagination support

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Vercel)                                      │
│  https://almudawwana-web.vercel.app                     │
│  - Next.js 16 with SSR                                  │
│  - Progressive Web App (PWA)                            │
└──────────────────────────────────┬──────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │ API Detection & Routing      │
                    │ (Automatic proxy translation) │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │ DreamHost (Shared Hosting)   │
                    │ https://almodawana.         │
                    │ dreamhosters.com            │
    ┌───────────────┼──────────────────────────┬─┴──────────────┐
    │               │                          │                │
    │       api-proxy.php (WORKAROUND)    .htaccess (404s)    Database
    │       - Codes endpoint               (mod_rewrite        (MySQL)
    │       - Articles endpoint            not enabled)        
    │       - Books endpoint                                   
    │       - Pagination support                               
    └───────────────────────────────────────────────────────────┘
```

## 🔧 How It Works

1. Frontend calls API function (e.g., `codes.list()`)
2. API client checks if URL contains "dreamhosters.com"
3. If yes: Translate path `/codes` → `api-proxy.php?endpoint=codes`
4. If no: Use regular `/api/v1` routes (local development)
5. Proxy returns data in same format as Laravel API
6. Frontend displays data normally

## 🧪 Local Testing

To test locally:
```bash
# Terminal 1: Start Laravel API
cd almudawwana-api
php artisan serve --port=8000

# Terminal 2: Start Next.js frontend
cd almudawwana-web
npm run dev

# Visit: http://localhost:3000
# Should show codes and articles from local database
```

## 📞 Support

If something doesn't work:
1. Check environment variable is set on Vercel
2. Test proxy directly: https://almodawana.dreamhosters.com/api-proxy.php?endpoint=codes
3. Verify database has data
4. Check browser console for errors
5. Check Vercel deployment logs
