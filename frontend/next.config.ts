import type { NextConfig } from "next";

const apiProxy = process.env.API_PROXY_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  agentRules: false,
  async rewrites() {
    if (!apiProxy) return [];
    return [
      { source: "/api/:path*", destination: `${apiProxy}/api/:path*` },
      { source: "/uploads/:path*", destination: `${apiProxy}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
