"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_STATUS_TRANSITIONS } from "./constants";
import { logApplicationEvent } from "@/lib/application-events";

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
  if (typeof newStage !== "string" || !newStage) {
    redirect("/board?error=Invalid status");
  }

  const { data: application } = await supabase
    .from("applications")
    .select("stage")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single();

  const currentStage = application?.stage;
  const allowedTargets = currentStage
    ? ALLOWED_STATUS_TRANSITIONS[currentStage]
    : undefined;

  if (!allowedTargets || !allowedTargets.includes(newStage)) {
    redirect("/board?error=Invalid status transition");
  }

  const { error } = await supabase
    .from("applications")
    .update({ stage: newStage })
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .eq("stage", currentStage); // compare-and-swap against the stage just validated

  if (error) {
    redirect(`/board?error=${encodeURIComponent(error.message)}`);
  }

  await logApplicationEvent(supabase, applicationId, "status_changed", {
    from_stage: currentStage,
    to_stage: newStage,
  });

  revalidatePath("/board");
}
