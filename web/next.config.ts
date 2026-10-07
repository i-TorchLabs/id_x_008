import type { NextConfig } from "next";

const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // 统一 URL 前缀 /f/008（HAProxy 据此路由到本前端服务）
  basePath: "/f/008",
  // 生产环境禁止暴露 source map（防止源码泄露）
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP_POLICY },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
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
        // ADFS 注册的回调地址（认证信息回传地址）为 /f/008/user/oauth2。
        // 但 /user 布局带 AuthGuard，会在 SSO 会话建立前把回调弹回 /login，
        // 故改写至顶层 /oauth2 页（/f/008/user/oauth2，root layout，无鉴权守卫）。
        source: "/user/oauth2",
        destination: "/oauth2",
      },
      {
        source: "/b/:path*",
        destination: `${process.env.BACKEND_URL ?? "http://localhost:8101"}/b/:path*`,
      },
    ];
  },
};

export default nextConfig;
