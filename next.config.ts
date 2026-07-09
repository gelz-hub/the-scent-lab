import type { NextConfig } from "next";

// Part 11 — production security headers. Applied to every response via
// next.config.ts headers() (Next.js's own mechanism — no new middleware
// dependency). See src/lib/security/README.md for the full CSP rationale
// and the specific external hosts each directive allows and why.
const isProd = process.env.NODE_ENV === "production";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  // 'unsafe-inline' is required for Next.js's own hydration/theme-init
  // inline scripts (no nonce wiring exists yet — see README, "Known
  // trade-offs"). 'unsafe-eval' is dev-only (Turbopack/webpack HMR needs
  // it; production never ships it).
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://www.googletagmanager.com https://www.google-analytics.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.tile.openstreetmap.org https://www.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self' data:",
  // XHR/fetch/WebSocket targets: our own API, Cloudinary (client-side
  // upload progress if ever added), Firebase (Cloud Messaging + Analytics),
  // Geoapify (autocomplete), Google Analytics, ABA PayWay/KHQR (payment
  // provider callbacks originate server-side, not browser-side, so those
  // hosts are NOT needed here — see README).
  "connect-src 'self' https://res.cloudinary.com https://*.googleapis.com https://*.firebaseio.com https://firebaseinstallations.googleapis.com https://fcmregistrations.googleapis.com https://api.geoapify.com https://www.google-analytics.com https://www.googletagmanager.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
];

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP_DIRECTIVES.join("; ") },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  // HSTS is meaningless (and potentially harmful) over plain HTTP in dev —
  // only sent in production, where the deployment target terminates HTTPS.
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "www.khqrapi.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
