"use server";

import { createClient } from "@/lib/supabase/server";
import { getCachedEmployerResearch } from "@/lib/drafting/employer-research";
import { generateInterviewQuestions, type GeneratedInterviewPrep } from "@/lib/interview-prep/generate";
import { INTERVIEW_PREP_STAGES } from "@/lib/interview-prep/constants";

type Result = { ok: true; data: GeneratedInterviewPrep } | { ok: false; error: string };

// Called client-side from the interview prep dialog when the student clicks
// "Generate questions" for the Video/Panel interview format. Never called
// for Online tests / Assessment centre (those are static explainers only,
// enforced client-side by the dialog only offering the button on those two
// formats -- but re-checked here too, since this is the actual premium and
// stage gate, not the UI).
export async function generateInterviewPrepQuestions(
  applicationId: string,
  format: "video_interview" | "panel_interview"
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in to generate interview prep." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("user_id", user.id)
    .single();

  if (profile?.subscription_tier !== "premium") {
    return { ok: false, error: "Upgrade to premium to generate AI interview prep questions." };
  }

  const { data: application } = await supabase
    .from("applications")
    .select(
      "id, stage, vacancies(employer_name, role_title, description, apprenticeship_level, standard_reference, location)"
    )
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single<{
      id: string;
      stage: string;
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
    return { ok: false, error: "Application not found." };
  }

  if (!INTERVIEW_PREP_STAGES.includes(application.stage as (typeof INTERVIEW_PREP_STAGES)[number])) {
    return { ok: false, error: "Interview prep is available once an application has been submitted." };
  }

  const vacancy = application.vacancies;

  const [employerResearch, employerSourceResult] = await Promise.all([
    getCachedEmployerResearch(vacancy.employer_name),
    supabase.from("employer_sources").select("notes").eq("employer_name", vacancy.employer_name).maybeSingle(),
  ]);

  try {
    const data = await generateInterviewQuestions({
      format,
      vacancy,
      employerResearch,
      employerSourceNotes: employerSourceResult.data?.notes ?? null,
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not generate interview prep right now.",
    };
  }
}
