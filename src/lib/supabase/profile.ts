import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Every authenticated user has a `profiles` row from the `on_auth_user_created`
 * DB trigger (see the initial schema migration), so a missing/errored result
 * here means the query itself failed transiently -- not that the user has no
 * profile. The previous `!profile?.onboarding_complete` pattern (duplicated
 * across every page gate) treated both cases identically, which meant a
 * transient query error silently sent an already-onboarded user back through
 * onboarding (TODO.md "UX m1"). One retry, then throw rather than guess.
 */
export async function requireProfile<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  userId: string,
  columns: string
): Promise<T> {
  let lastError: { message: string } | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await supabase
      .from("profiles")
      .select(columns)
      .eq("user_id", userId)
      .single();

    if (!error && data) {
      return data as unknown as T;
    }

    lastError = error;
  }

  throw new Error(
    `Failed to load profile for user ${userId} after retry: ${lastError?.message ?? "no data returned"}`
  );
}
