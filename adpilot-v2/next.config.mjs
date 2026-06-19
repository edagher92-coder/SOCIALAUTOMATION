/** @type {import('next').NextConfig} */
// NOTE: Content-Security-Policy is set per-request in proxy.ts (it needs a per-request script
// nonce, which a static header can't provide). The static headers below apply to every route.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Force HTTPS for 2 years incl. subdomains (Vercel serves HTTPS) and isolate the browsing
  // context group so a cross-origin opener can't reach our window.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig = {
  reactStrictMode: true,
  // Note: Next 16 no longer runs ESLint during `next build` (it's a separate `next lint`/CI
  // step), so the old `eslint.ignoreDuringBuilds` key is unsupported and has been removed.
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
export default nextConfig;
