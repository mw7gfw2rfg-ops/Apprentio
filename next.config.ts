import type { NextConfig } from "next";

// Every directive here reflects what the app actually loads/talks to
// client-side today, grep-confirmed, not a guess (OVERNIGHT_SECURITY_REVIEW.md
// #6):
// - No client component ever calls Supabase, Stripe, or any other external
//   origin directly -- all of that happens server-side (Server Actions,
//   route handlers), which the browser's CSP doesn't govern at all. Stripe
//   Checkout/Portal (billing/actions.ts) and Supabase Storage's signed-URL
//   download links (the CV/cover-letter "view current" links) are both
//   full top-level navigations (redirect()/<a href>), not fetch/XHR/iframe
//   -- CSP's fetch directives (connect-src, frame-src, etc.) don't apply to
//   those, so neither origin needs to appear below.
// - script-src/style-src need 'unsafe-inline': next-themes' blocking theme
//   script (see layout.tsx), Next.js's own hydration/RSC payload scripts,
//   and the one dangerouslySetInnerHTML in accent-style.tsx (regex-validated
//   `^#[0-9a-fA-F]{6}$` hex colours only, see Security review "solid" list)
//   are all real inline script/style -- this app has no nonce
//   infrastructure to avoid 'unsafe-inline' safely yet.
// - frame-ancestors 'none' (+ X-Frame-Options below, for older browsers):
//   nothing here is meant to be embedded.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  experimental: {
    // Default is 1MB. Interview-practice recordings are opus/AAC audio up
    // to ~3 minutes (matching the app's own documented video-interview
    // answer window) submitted as a Server Action FormData payload -- a
    // 15MB ceiling comfortably covers that with margin, while still
    // bounding worst-case payload size server-side.
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
