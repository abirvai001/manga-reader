import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "mozilla.github.io" },
    ],
  },
  // Next.js 16 uses Turbopack by default; silence webpack-only alias warning
  turbopack: {},
};

export default nextConfig;
