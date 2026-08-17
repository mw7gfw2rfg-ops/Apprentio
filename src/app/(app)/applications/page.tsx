import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApplicationCard } from "@/components/application-card";
import { Badge } from "@/components/ui/badge";
import { AddManualApplicationDialog } from "./AddManualApplicationDialog";
import {
  addManualApplication,
  approveApplication,
  draftApplication,
  editDraft,
  markManualSubmitted,
  markSubmitted,
  rejectApplication,
} from "./actions";

const FREE_DRAFT_LIMIT = 2;

type ApplicationRow = {
  id: string;
  stage: string;
  drafted_cv: string | null;
  drafted_cover_letter: string | null;
  draft_notes: string | null;
  approved_at: string | null;
  submitted_at: string | null;
  vacancy_id: string | null;
  manual_employer_name: string | null;
  manual_role_title: string | null;
  manual_apply_url: string | null;
  manual_closing_date: string | null;
  vacancies: {
    employer_name: string;
    role_title: string;
    apply_url: string | null;
    closing_date: string | null;
  } | null;
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "onboarding_complete, subscription_tier, free_drafts_used, base_cv_storage_path, base_cover_letter_storage_path"
    )
    .eq("user_id", user.id)
    .single();

  if (!profile?.onboarding_complete) {
    redirect("/onboarding");
  }

  const isPremium = profile.subscription_tier === "premium";
  const freeDraftsRemaining = Math.max(0, FREE_DRAFT_LIMIT - profile.free_drafts_used);
  const canDraft = isPremium || freeDraftsRemaining > 0;
  const hasBaseDocuments = Boolean(
    profile.base_cv_storage_path && profile.base_cover_letter_storage_path
  );

  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, stage, drafted_cv, drafted_cover_letter, draft_notes, approved_at, submitted_at, vacancy_id, manual_employer_name, manual_role_title, manual_apply_url, manual_closing_date, vacancies(employer_name, role_title, apply_url, closing_date)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<ApplicationRow[]>();

  // Backs the "Interview prep engaged" readiness step -- a real recorded
  // practice attempt, not just having opened the prep dialog (which isn't
  // persisted anywhere). One cheap query for the whole list rather than
  // one per card.
  const { data: practiceAttempts } = await supabase
    .from("interview_practice_attempts")
    .select("application_id")
    .eq("user_id", user.id);
  const applicationIdsWithPractice = new Set(
    (practiceAttempts ?? []).map((row) => row.application_id)
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My applications</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={isPremium ? "default" : "secondary"}>
              {isPremium ? "Premium" : "Free"}
            </Badge>
            {!isPremium &&
              `${freeDraftsRemaining} free draft${freeDraftsRemaining === 1 ? "" : "s"} left`}
          </p>
        </div>
        <AddManualApplicationDialog addManualApplication={addManualApplication} />
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {(applications ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nothing saved yet — save a vacancy from Discover apprenticeships first.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {(applications ?? []).map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            canDraft={canDraft}
            hasBaseDocuments={hasBaseDocuments}
            hasPracticeAttempt={applicationIdsWithPractice.has(application.id)}
            isPremium={isPremium}
            freeDraftsRemaining={freeDraftsRemaining}
            draftApplication={draftApplication}
            editDraft={editDraft}
            approveApplication={approveApplication}
            rejectApplication={rejectApplication}
            markSubmitted={markSubmitted}
            markManualSubmitted={markManualSubmitted}
          />
        ))}
      </div>
    </div>
  );
}
