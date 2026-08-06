import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApplicationCard } from "@/components/application-card";
import { Badge } from "@/components/ui/badge";
import {
  approveApplication,
  draftApplication,
  editDraft,
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
      "id, stage, drafted_cv, drafted_cover_letter, draft_notes, approved_at, submitted_at, vacancies(employer_name, role_title, apply_url, closing_date)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<ApplicationRow[]>();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
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
            isPremium={isPremium}
            freeDraftsRemaining={freeDraftsRemaining}
            draftApplication={draftApplication}
            editDraft={editDraft}
            approveApplication={approveApplication}
            rejectApplication={rejectApplication}
            markSubmitted={markSubmitted}
          />
        ))}
      </div>
    </div>
  );
}
