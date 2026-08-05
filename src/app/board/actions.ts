"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// These four are the only manual, post-submission outcomes — they happen
// outside the app (an employer calls, emails, or goes quiet) so someone has
// to tell the board. Deliberately excludes every other stage: this action
// only ever fires from 'submitted', not a general stage-jumper.
const MANUAL_OUTCOME_STAGES = ["interview", "offer", "rejected", "withdrawn"] as const;

export async function updateApplicationStatus(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const applicationId = formData.get("application_id");
  const newStage = formData.get("new_stage");

  if (typeof applicationId !== "string" || !applicationId) {
    redirect("/board?error=Missing application");
  }
  if (
    typeof newStage !== "string" ||
    !(MANUAL_OUTCOME_STAGES as readonly string[]).includes(newStage)
  ) {
    redirect("/board?error=Invalid status");
  }

  const { error } = await supabase
    .from("applications")
    .update({ stage: newStage })
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .eq("stage", "submitted");

  if (error) {
    redirect(`/board?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/board");
}
