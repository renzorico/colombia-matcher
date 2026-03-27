import type { NextConfig } from "next";

// Read at build time — must be set in Vercel project env vars before first deploy.
// Falls back to localhost:8000 for local development.
const backendUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // ui-avatars is used as onError fallback for broken candidate photos
        protocol: "https",
        hostname: "ui-avatars.com",
      },
    ],
  },
  async rewrites() {
    return [
      { source: "/api/backend/:path*", destination: `${backendUrl}/:path*` },
    ];
  },
};

export default nextConfig;
