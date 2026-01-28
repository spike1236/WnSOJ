import type { NextConfig } from "next";

const backendOrigin = process.env.BACKEND_ORIGIN?.replace(/\/+$/, "") || "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8081"
  ],
  async rewrites() {
    if (process.env.NODE_ENV === "production") return [];
    return [
      { source: "/admin/:path*", destination: `${backendOrigin}/admin/:path*` },
      { source: "/static/:path*", destination: `${backendOrigin}/static/:path*` },
      { source: "/media/:path*", destination: `${backendOrigin}/media/:path*` }
    ];
  }
};

export default nextConfig;
