"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateDraft } from "@/lib/drafting/draft";
import { checkRateLimit } from "@/lib/rate-limit";

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
  // free-tier user is out of drafts, but that's UX only. The actual cap is
  // enforced below via an atomic claim, not this read.
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, base_cv_storage_path, base_cover_letter_storage_path")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    redirect("/applications?error=Profile not found");
  }

  const isPremium = profile.subscription_tier === "premium";

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

  // Defense-in-depth against a scripted/compromised-account loop, independent
  // of the tier check above — applies to premium too, since "unlimited"
  // is about the tier gate, not about having zero technical ceiling on real
  // Anthropic spend (OVERNIGHT_SECURITY_REVIEW.md #2). Checked before the
  // free-draft claim so a rate-limited request doesn't burn a free slot.
  const draftRateLimit = await checkRateLimit(supabase, "draft");
  if (!draftRateLimit.allowed) {
    redirect(`/applications?error=${encodeURIComponent(draftRateLimit.error)}`);
  }

  // Atomic check-and-increment, claimed *before* the Anthropic call — a
  // single `UPDATE ... WHERE free_drafts_used < $limit RETURNING` (see
  // claim_free_draft in the migrations), not a read-then-write. Concurrent
  // requests serialise on the same row: only as many as remain under the
  // cap can ever claim a slot, so this is what actually stops unbounded
  // real Anthropic cost, not the redirect-on-read this replaced.
  let claimed = false;
  if (!isPremium) {
    const { data: newCount, error: claimError } = await supabase.rpc("claim_free_draft", {
      p_limit: FREE_DRAFT_LIMIT,
    });
    if (claimError) {
      redirect(`/applications?error=${encodeURIComponent(claimError.message)}`);
    }
    if (newCount === null) {
      redirect(
        "/applications?error=" +
          encodeURIComponent(
            `You've used your ${FREE_DRAFT_LIMIT} free drafts — upgrade to premium for unlimited drafts`
          )
      );
    }
    claimed = true;
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
  } catch (err) {
    // Roll back the claimed slot — also a single atomic statement (see
    // release_free_draft), not read-then-write — so a failed draft doesn't
    // permanently cost the student one of their free attempts.
    if (claimed) {
      await supabase.rpc("release_free_draft");
    }
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
