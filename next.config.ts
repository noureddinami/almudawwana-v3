import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/why', destination: '/why.html' },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aoojpafediogwfdacqww.supabase.co',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

export default nextConfig;
