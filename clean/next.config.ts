import type { NextConfig } from "next";

/**
 * Two build modes:
 *  - default: Node server build (standalone) with middleware, API routes,
 *    nonce CSP and the gated trade area.
 *  - STATIC_EXPORT=1: static export for GitHub Pages, produced by
 *    scripts/build-static.mjs. Server-only features are excluded there.
 */
const isStatic = process.env.STATIC_EXPORT === "1";
const basePath = process.env.STATIC_BASE_PATH ?? "";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  output: isStatic ? "export" : "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  env: { NEXT_PUBLIC_STATIC_EXPORT: isStatic ? "1" : "" },
  ...(isStatic
    ? {
        basePath,
        assetPrefix: basePath || undefined,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        images: { formats: ["image/avif", "image/webp"] },
        async headers() {
          return [{ source: "/:path*", headers: securityHeaders }];
        },
      }),
};

export default nextConfig;
