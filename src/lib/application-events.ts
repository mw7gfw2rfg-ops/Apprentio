import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// One event_type per real lifecycle transition (OVERNIGHT_SECURITY_REVIEW.md
// #8) -- "status_changed" covers every stage transition the student didn't
// directly author a draft for (submitted, interview, offer, rejected,
// withdrawn), since it's the same kind of event regardless of which stage
// it lands on; the payload's to_stage is what distinguishes them.
export type ApplicationEventType =
  | "draft_generated"
  | "draft_edited"
  | "draft_approved"
  | "draft_rejected"
  | "status_changed";

// Best-effort: an audit-log failure must never block the real action it's
// recording (a Supabase blip shouldn't stop a student approving their own
// draft), so this logs and swallows rather than throwing. The real safety
// property here is the human-approval gate itself, which this only records
// -- it doesn't enforce anything.
export async function logApplicationEvent(
  supabase: SupabaseClient,
  applicationId: string,
  eventType: ApplicationEventType,
  payload: Record<string, unknown> = {}
): Promise<void> {
  const { error } = await supabase
    .from("application_events")
    .insert({ application_id: applicationId, event_type: eventType, payload });

  if (error) {
    console.error(`application_events insert failed (${eventType}, ${applicationId}):`, error.message);
  }
}
