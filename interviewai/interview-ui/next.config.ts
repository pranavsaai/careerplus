import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/ws/:path*",
        destination: "http://54.209.17.183/ws/:path*",
      },
    ];
  },
};

export default nextConfig;