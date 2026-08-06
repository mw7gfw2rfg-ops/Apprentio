// Any code building an absolute URL for Supabase auth redirects or Stripe
// return URLs must go through this instead of reading NEXT_PUBLIC_SITE_URL
// directly. Prefers the explicit env var (so a custom domain can be pinned),
// but falls back to Vercel's own production-domain system var if that ever
// drifts or gets left unset in an environment's config, rather than silently
// producing a broken/undefined URL that auth providers fall back to their
// own dashboard default for.
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}
