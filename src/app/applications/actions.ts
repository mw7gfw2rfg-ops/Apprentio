"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateDraft } from "@/lib/drafting/draft";

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

  // Mandatory server-side gate — the UI hides the real Draft button from
  // free-tier users, but that's UX only. This check is what actually stops
  // the Anthropic API from being called for a non-premium account.
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, base_cv_storage_path, base_cover_letter_storage_path")
    .eq("user_id", user.id)
    .single();

  if (profile?.subscription_tier !== "premium") {
    redirect(
      "/applications?error=" +
        encodeURIComponent("Upgrade to premium to draft a tailored CV and cover letter")
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
  } catch (err) {
    redirect(
      `/applications?error=${encodeURIComponent(err instanceof Error ? err.message : "Draft failed")}`
    );
  }

  revalidatePath("/applications");
}
