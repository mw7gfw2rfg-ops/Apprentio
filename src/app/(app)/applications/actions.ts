"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateDraft } from "@/lib/drafting/draft";
import { checkRateLimit } from "@/lib/rate-limit";
import { logApplicationEvent } from "@/lib/application-events";

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
      "id, vacancy_id, vacancies(employer_name, role_title, description, apprenticeship_level, standard_reference, location)"
    )
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single<{
      id: string;
      vacancy_id: string | null;
      vacancies: {
        employer_name: string;
        role_title: string;
        description: string | null;
        apprenticeship_level: number | null;
        standard_reference: string | null;
        location: string | null;
      } | null;
    }>();

  if (!application) {
    redirect("/applications?error=Application not found");
  }

  if (!application.vacancy_id || !application.vacancies) {
    redirect(
      "/applications?error=" +
        encodeURIComponent(
          "AI drafting isn't available for manually-added applications — Apprentio doesn't have the listing details it needs to tailor a draft."
        )
    );
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

    await logApplicationEvent(supabase, applicationId, "draft_generated", {
      to_stage: "ready_for_review",
    });
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

  await logApplicationEvent(supabase, applicationId, "draft_edited");

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

  await logApplicationEvent(supabase, applicationId, "draft_approved", {
    from_stage: "ready_for_review",
    to_stage: "approved",
  });

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

  await logApplicationEvent(supabase, applicationId, "draft_rejected", {
    from_stage: "ready_for_review",
    to_stage: "saved",
    reason,
  });

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

  await logApplicationEvent(supabase, applicationId, "status_changed", {
    from_stage: "approved",
    to_stage: "submitted",
  });

  revalidatePath("/applications");
}

// A manual entry has no draft to approve, so it can't reach 'submitted' via
// the normal saved -> ready_for_review -> approved -> submitted path (that
// path is gated behind draftApplication, which manual entries can't use).
// This gives it a direct saved -> submitted transition instead, for the
// same reason markSubmitted exists: the student applied outside the app and
// is just recording that here.
export async function markManualSubmitted(formData: FormData) {
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
    .eq("stage", "saved")
    .is("vacancy_id", null);

  if (error) {
    redirect(`/applications?error=${encodeURIComponent(error.message)}`);
  }

  await logApplicationEvent(supabase, applicationId, "status_changed", {
    from_stage: "saved",
    to_stage: "submitted",
  });

  revalidatePath("/applications");
  revalidatePath("/board");
}

// Tracks an apprenticeship Apprentio hasn't indexed. No vacancy_id, so no AI
// drafting or AI interview prep — those need real listing/employer data
// (see the vacancy_id guard in draftApplication and
// generateInterviewPrepQuestions). Manual stage tracking, board movement,
// and mark-submitted all work the same as a vacancy-backed application.
export async function addManualApplication(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const employerName = (formData.get("employer_name") as string | null)?.trim();
  const roleTitle = (formData.get("role_title") as string | null)?.trim();
  const applyUrl = (formData.get("apply_url") as string | null)?.trim();
  const closingDate = (formData.get("closing_date") as string | null)?.trim();

  if (!employerName || !roleTitle) {
    redirect(
      "/applications?error=" +
        encodeURIComponent("Employer name and role title are required")
    );
  }

  const { error } = await supabase.from("applications").insert({
    user_id: user.id,
    vacancy_id: null,
    stage: "saved",
    manual_employer_name: employerName,
    manual_role_title: roleTitle,
    manual_apply_url: applyUrl || null,
    manual_closing_date: closingDate || null,
  });

  if (error) {
    redirect(`/applications?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/applications");
  revalidatePath("/board");
}
