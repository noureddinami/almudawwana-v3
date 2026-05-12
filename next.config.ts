import type { NextConfig } from "next";

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/almodawana\.dreamhosters\.com\/api\/v1\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https?.*\.(?:png|gif|jpg|jpeg|svg)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https?.*\.(?:css|js)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-cache',
      },
    },
  ],
});

const nextConfig: NextConfig = {
  // SSR (Server-Side Rendering) pour Vercel
  // Pas de static export - cela permet ISR et Dynamic Routes

  // Images optimisées par Vercel
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'almodawana.dreamhosters.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  // API URL configuration
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ||
      'http://127.0.0.1:8000/api/v1',
  },

  // Turbopack config pour next-pwa
  turbopack: {},
};

export default withPWA(nextConfig);
