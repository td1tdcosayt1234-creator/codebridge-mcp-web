/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";
// Inline styles/scripts are used across the app (Next.js runtime + style
// attributes), so 'unsafe-inline' is required; dev HMR additionally needs
// 'unsafe-eval' and ws:. Everything else is locked down.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://cdn.paddle.com https://static.cloudflareinsights.com`,
  "style-src 'self' 'unsafe-inline' https://*.paddle.com",
  "img-src 'self' data: blob: https://*.paddle.com",
  "font-src 'self' data:",
  "connect-src 'self' ws: wss: https://*.paddle.com https://api.paddle.com https://sandbox-api.paddle.com",
  "frame-src https://*.paddle.com https://checkout.paddle.com https://sandbox-checkout-service.paddle.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // First-party GA4 proxy: adblockers nuke googletagmanager.com /
  // google-analytics.com domains, so the tag loads and sends hits
  // through our own origin instead. Query strings pass through.
  async rewrites() {
    return [
      { source: "/gtagjs", destination: "https://www.googletagmanager.com/gtag/js" },
      { source: "/g/collect", destination: "https://www.google-analytics.com/g/collect" },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};
module.exports = nextConfig;

