"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateDraft } from "@/lib/drafting/draft";

const FREE_DRAFT_LIMIT = 2;

export async function draftApplication(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const applicationId = formData.get("application_id");
  if (typeof applicationId !== "string" || !applicationId) {
    redirect("/applications?error=Missing application");
  }

  // Mandatory server-side gate — the UI hides the real Draft button once a
  // free-tier user is out of drafts, but that's UX only. This check is what
  // actually stops the Anthropic API from being called beyond the cap.
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "subscription_tier, free_drafts_used, base_cv_storage_path, base_cover_letter_storage_path"
    )
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    redirect("/applications?error=Profile not found");
  }

  const isPremium = profile.subscription_tier === "premium";
  if (!isPremium && profile.free_drafts_used >= FREE_DRAFT_LIMIT) {
    redirect(
      "/applications?error=" +
        encodeURIComponent(
          `You've used your ${FREE_DRAFT_LIMIT} free drafts — upgrade to premium for unlimited drafts`
        )
    );
  }

  if (!profile.base_cv_storage_path || !profile.base_cover_letter_storage_path) {
    redirect(
      "/applications?error=" +
        encodeURIComponent("Upload your base CV and cover letter first")
    );
  }

  const { data: application } = await supabase
    .from("applications")
    .select(
      "id, vacancies(employer_name, role_title, description, apprenticeship_level, standard_reference, location)"
    )
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single<{
      id: string;
      vacancies: {
        employer_name: string;
        role_title: string;
        description: string | null;
        apprenticeship_level: number | null;
        standard_reference: string | null;
        location: string | null;
      } | null;
    }>();

  if (!application || !application.vacancies) {
    redirect("/applications?error=Application not found");
  }

  try {
    const { tailoredCv, tailoredCoverLetter } = await generateDraft({
      supabase,
      baseCvPath: profile.base_cv_storage_path,
      baseCoverLetterPath: profile.base_cover_letter_storage_path,
      vacancy: application.vacancies,
    });

    const { error } = await supabase
      .from("applications")
      .update({
        drafted_cv: tailoredCv,
        drafted_cover_letter: tailoredCoverLetter,
        stage: "ready_for_review",
      })
      .eq("id", applicationId)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(error.message);
    }

    // free_drafts_used isn't writable by the authenticated role (see the
    // column-lockdown migration) — this admin-client write is safe because
    // the draft actually succeeded and every check above already confirmed
    // this is the real, authenticated owner of the application.
    const admin = createAdminClient();
    const { error: countError } = await admin
      .from("profiles")
      .update({ free_drafts_used: profile.free_drafts_used + 1 })
      .eq("user_id", user.id);
    if (countError) {
      throw new Error(countError.message);
    }
  } catch (err) {
    redirect(
      `/applications?error=${encodeURIComponent(err instanceof Error ? err.message : "Draft failed")}`
    );
  }

  revalidatePath("/applications");
}

function getApplicationId(formData: FormData): string {
  const id = formData.get("application_id");
  if (typeof id !== "string" || !id) {
    redirect("/applications?error=Missing application");
  }
  return id;
}

// Saves edited draft text without changing stage — lets the student adjust
// content, then decide separately whether to Approve.
export async function editDraft(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const applicationId = getApplicationId(formData);
  const draftedCv = formData.get("drafted_cv");
  const draftedCoverLetter = formData.get("drafted_cover_letter");

  if (typeof draftedCv !== "string" || typeof draftedCoverLetter !== "string") {
    redirect("/applications?error=Missing draft content");
  }

  const { error } = await supabase
    .from("applications")
    .update({ drafted_cv: draftedCv, drafted_cover_letter: draftedCoverLetter })
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .eq("stage", "ready_for_review");

  if (error) {
    redirect(`/applications?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/applications");
}

// Approves using whatever is currently in the form fields, so an edit made
// just before clicking Approve is captured in the same step.
export async function approveApplication(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const applicationId = getApplicationId(formData);
  const draftedCv = formData.get("drafted_cv");
  const draftedCoverLetter = formData.get("drafted_cover_letter");

  if (typeof draftedCv !== "string" || typeof draftedCoverLetter !== "string") {
    redirect("/applications?error=Missing draft content");
  }

  const { error } = await supabase
    .from("applications")
    .update({
      drafted_cv: draftedCv,
      drafted_cover_letter: draftedCoverLetter,
      stage: "approved",
      approved_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .eq("stage", "ready_for_review");

  if (error) {
    redirect(`/applications?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/applications");
}

// Sends a rejected draft back to 'saved', not PLAN.md's terminal 'rejected'
// stage — that stage means a real employer decision post-submission. Reusing
// it here would conflate "I didn't like this AI draft" with an actual
// rejection, corrupting both the kanban board and any future rejection-rate
// tracking. The reason is kept in draft_notes; drafted content is cleared so
// a stale rejected draft can't be mistaken for the current one.
export async function rejectApplication(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const applicationId = getApplicationId(formData);
  const reason = (formData.get("reason") as string | null)?.trim() ?? "";

  if (!reason) {
    redirect("/applications?error=A reason is required to reject a draft");
  }

  const { error } = await supabase
    .from("applications")
    .update({
      stage: "saved",
      drafted_cv: null,
      drafted_cover_letter: null,
      draft_notes: reason,
    })
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .eq("stage", "ready_for_review");

  if (error) {
    redirect(`/applications?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/applications");
}

export async function markSubmitted(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const applicationId = getApplicationId(formData);

  const { error } = await supabase
    .from("applications")
    .update({
      stage: "submitted",
      submitted_at: new Date().toISOString(),
      submission_method: "manual",
    })
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .eq("stage", "approved");

  if (error) {
    redirect(`/applications?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/applications");
}
