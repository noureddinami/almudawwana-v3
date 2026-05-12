# 📚 Al-Mudawwana — Web PWA

> **الموسوعة القانونية المغربية** — Arabic Legal Encyclopedia (Morocco)  
> A comprehensive Progressive Web App for Moroccan laws, codes, and legal references.

## 🎯 About

Al-Mudawwana is a **PWA (Progressive Web App)** providing access to Moroccan legal codes and articles with:

- ✅ **Responsive Design** — Works on mobile, tablet, desktop
- ✅ **Installable** — Install as native app from browser
- ✅ **Offline Support** — Service workers + caching
- ✅ **Fast Performance** — Optimized with Vercel CDN
- ✅ **Arabic RTL** — Full Arabic support
- ✅ **Admin Panel** — CRUD for codes, articles, comments

## 🛠 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js (SSR) | 16.2.4 |
| **PWA** | next-pwa | 5.6.0 |
| **Styling** | Tailwind CSS | v4 |
| **Arabic Fonts** | Google Fonts (Amiri, Naskh, Kufi) | Latest |
| **Backend** | Laravel API | 12.x |
| **Database** | MySQL | 8.x |
| **Deployment** | Vercel | CDN |

## 📦 Project Structure

```
almudawwana-web/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Homepage
│   ├── layout.tsx           # Root layout + PWA metadata
│   ├── codes/               # Codes listing
│   ├── search/              # Search interface
│   ├── admin/               # Admin dashboard
│   └── auth/                # Authentication
├── components/              # Reusable React components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── CommentsSection.tsx
│   └── ...
├── lib/                     # API clients & utilities
│   ├── api.ts              # Public API client
│   └── adminApi.ts         # Admin API client
├── public/                  # Static assets + PWA
│   ├── manifest.json       # Web App Manifest
│   ├── icon-192x192.png    # PWA icon
│   ├── icon-512x512.png
│   └── icon-maskable.png
├── next.config.ts          # Next.js config + PWA
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind config
└── package.json            # Dependencies

```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Laravel API running (see parent repo)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/almudawwana-web.git
cd almudawwana-web

# Install dependencies
npm install

# Generate PWA icons (if needed)
npm run generate:icons

# Create .env file
cp .env.example .env.local
# Edit .env.local with your API URL
```

### Development

```bash
# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

The app auto-reloads as you edit files (HMR enabled).

### Build

```bash
# Build for production
npm run build

# Test production build locally
npm run build
npm start
```

## 🌐 Environment Variables

Create `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1

# Email Configuration (for contact form)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@example.com
```

> ⚠️ **Never commit `.env.local`** — it contains secrets!

## 📱 PWA Features

### Installation
1. Open the app in Chrome/Edge
2. Click the "+" icon in the address bar
3. Select "Install Al-Mudawwana"
4. App appears on home screen ✨

### Offline Support
- Service worker caches pages and API responses
- Works without internet connection
- Automatic revalidation when online

### Responsive Design
- **Mobile**: 320-767px
- **Tablet**: 768-1024px
- **Desktop**: 1025px+

## 🔗 API Integration

The app connects to a **Laravel API**:

```
Frontend (Vercel)  ←→  Backend (DreamHost)
https://example.com    https://api.example.com/api/v1
```

**API Endpoints:**
- `GET /codes` — List all codes
- `GET /codes/{slug}` — Code detail
- `GET /codes/{slug}/articles` — Articles in code
- `GET /search?q=...` — Full-text search
- `POST /comments` — Submit comment (auth required)
- `GET /admin/*` — Admin endpoints (auth + role required)

## 🔐 Authentication

- **Public Routes**: Browse codes, search, read articles
- **User Routes**: Submit comments, manage profile
- **Admin Routes**: CRUD codes, articles, users, comments

Login via:
- Email/Password
- Google OAuth

## 📚 Documentation

- **[PWA_SETUP.md](./PWA_SETUP.md)** — PWA configuration details
- **[AGENTS.md](./AGENTS.md)** — Agent/AI guidance
- **[CLAUDE.md](./CLAUDE.md)** — Development guidelines

See parent repo for:
- Server deployment guides
- Database schema
- API documentation

## 🚢 Deployment

### Deploy to Vercel (Recommended)

```bash
# Push to GitHub
git push origin main

# In Vercel Dashboard:
# 1. Import from GitHub
# 2. Set NEXT_PUBLIC_API_URL env var
# 3. Deploy!
```

Auto-deploys on every `git push`.

### Deployment Guides

- **[VERCEL_DEPLOYMENT.md](../VERCEL_DEPLOYMENT.md)** — Full Vercel setup

## 🧪 Testing

```bash
# Run tests (if configured)
npm test

# Run type check
npx tsc --noEmit

# Lint
npm run lint
```

## 📊 Performance

Optimized for:
- **LCP** (Largest Contentful Paint) < 2.5s
- **FID** (First Input Delay) < 100ms
- **CLS** (Cumulative Layout Shift) < 0.1

Uses:
- Image optimization (Next.js)
- Code splitting (Turbopack)
- Service worker caching
- Vercel CDN edge locations

## 🐛 Troubleshooting

### API calls failing
```
Check:
1. API_URL env var is set correctly
2. Laravel API is running
3. CORS is configured on backend
```

### PWA not installing
```
Check:
1. manifest.json exists in public/
2. Icons exist (icon-*.png files)
3. Using HTTPS (or localhost for dev)
```

### Build fails
```
Clear cache and rebuild:
rm -rf .next node_modules
npm install
npm run build
```

## 📝 License

This project is part of Al-Mudawwana legal reference system.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- **Documentation**: See parent repo
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

**Made with ❤️ for Moroccan legal transparency**
