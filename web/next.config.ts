import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/b/:path*",
        destination: `${process.env.BACKEND_URL ?? "http://localhost:8101"}/b/:path*`,
      },
    ];
  },
};

export default nextConfig;
