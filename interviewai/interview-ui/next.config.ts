import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://54.209.17.183/api/:path*",
      },
    ];
  },
};

export default nextConfig;