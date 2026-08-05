import { createClient } from "@supabase/supabase-js";

// Service-role client for server-only jobs (cron sync, admin seed scripts).
// Bypasses RLS — never import this from client code or expose the key to the browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
