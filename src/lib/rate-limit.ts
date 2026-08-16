import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Defense-in-depth against a scripted loop or a compromised account, not a
// product-tier restriction -- premium's "unlimited" is about the tier gate
// (no per-draft cap), not about having zero technical ceiling on real
// Anthropic spend. See OVERNIGHT_SECURITY_REVIEW.md #2.
//
// employer_research is capped lower than the other two: it's the most
// expensive call (multi-round web search, ~40-90s), and it's already
// naturally self-limiting for genuine use since results are cached 30 days
// per employer -- a real user essentially never triggers more than a
// handful of real research calls per hour, only for employers they haven't
// drafted for before.
const RATE_LIMITS = {
  draft: 20,
  interview_prep: 20,
  employer_research: 10,
  // Heaviest per-call cost of any action here: an audio upload, a Whisper
  // transcription round-trip, then a second Anthropic call for feedback --
  // three external I/O hops per request, not one. Capped well below the
  // others for that reason, same defense-in-depth rationale as the rest of
  // this file.
  interview_practice: 8,
} as const;

export type RateLimitedAction = keyof typeof RATE_LIMITS;

export type RateLimitCheck = { allowed: true } | { allowed: false; error: string };

// Backed by claim_ai_rate_limit: a single atomic
// INSERT ... ON CONFLICT DO UPDATE ... WHERE request_count < limit
// RETURNING (fixed hourly window), not a read-then-write count check --
// concurrent calls from the same user serialise on that row the same way
// claim_free_draft already does for the free-draft cap. NULL back means
// the window's limit is already claimed.
export async function checkRateLimit(
  supabase: SupabaseClient,
  action: RateLimitedAction
): Promise<RateLimitCheck> {
  const { data, error } = await supabase.rpc("claim_ai_rate_limit", {
    p_action: action,
    p_limit: RATE_LIMITS[action],
  });

  if (error) {
    return { allowed: false, error: error.message };
  }
  if (data === null) {
    return {
      allowed: false,
      error: "You're sending requests too quickly — wait a bit and try again.",
    };
  }
  return { allowed: true };
}
