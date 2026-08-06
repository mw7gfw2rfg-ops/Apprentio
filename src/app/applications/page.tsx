import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  approveApplication,
  draftApplication,
  editDraft,
  markSubmitted,
  rejectApplication,
} from "./actions";
import { DraftSubmitButton } from "./DraftSubmitButton";

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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold">My applications</h1>
        <p className="text-sm text-neutral-500">
          Subscription: {profile.subscription_tier}
          {!isPremium && ` — ${freeDraftsRemaining} free draft${freeDraftsRemaining === 1 ? "" : "s"} left`}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {(applications ?? []).length === 0 && (
        <p className="text-sm text-neutral-500">
          Nothing saved yet — save a vacancy from Discover apprenticeships first.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {(applications ?? []).map((application) => {
          const vacancy = application.vacancies;
          if (!vacancy) return null;

          return (
            <li
              key={application.id}
              id={`application-${application.id}`}
              className="scroll-mt-4 rounded border p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium">{vacancy.role_title}</h2>
                  <p className="text-sm text-neutral-500">{vacancy.employer_name}</p>
                </div>
                <span className="rounded-full border px-2 py-0.5 text-xs uppercase text-neutral-500">
                  {application.stage.replaceAll("_", " ")}
                </span>
              </div>

              {application.stage === "saved" && (
                <div className="mt-3 flex flex-col gap-2">
                  {application.draft_notes && (
                    <p className="text-sm text-neutral-500">
                      Last draft rejected: {application.draft_notes}
                    </p>
                  )}
                  {!canDraft && (
                    <button
                      type="button"
                      disabled
                      title="Upgrade to premium to unlock unlimited AI drafting"
                      className="rounded border px-3 py-1.5 text-sm opacity-50"
                    >
                      Upgrade to draft a tailored CV & cover letter for this application
                    </button>
                  )}
                  {canDraft && !hasBaseDocuments && (
                    <p className="text-sm text-red-600">
                      Upload your base CV and cover letter in your profile before drafting.
                    </p>
                  )}
                  {canDraft && hasBaseDocuments && (
                    <div className="flex flex-col gap-1">
                      <form action={draftApplication}>
                        <input type="hidden" name="application_id" value={application.id} />
                        <DraftSubmitButton />
                      </form>
                      {!isPremium && (
                        <p className="text-xs text-neutral-400">
                          {freeDraftsRemaining} free draft
                          {freeDraftsRemaining === 1 ? "" : "s"} remaining
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {application.stage === "ready_for_review" && (
                <div className="mt-3 flex flex-col gap-3 text-sm">
                  <form className="flex flex-col gap-3">
                    <input type="hidden" name="application_id" value={application.id} />
                    <label className="flex flex-col gap-1">
                      <span className="text-xs uppercase text-neutral-400">Tailored CV</span>
                      <textarea
                        name="drafted_cv"
                        defaultValue={application.drafted_cv ?? ""}
                        rows={10}
                        className="rounded border bg-neutral-50 p-3 font-mono text-xs dark:bg-neutral-900"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs uppercase text-neutral-400">
                        Tailored cover letter
                      </span>
                      <textarea
                        name="drafted_cover_letter"
                        defaultValue={application.drafted_cover_letter ?? ""}
                        rows={10}
                        className="rounded border bg-neutral-50 p-3 font-mono text-xs dark:bg-neutral-900"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        formAction={editDraft}
                        className="rounded border px-3 py-1.5 text-sm transition-transform active:scale-[0.97]"
                      >
                        Save edit
                      </button>
                      <button
                        formAction={approveApplication}
                        className="rounded bg-black px-3 py-1.5 text-sm text-white transition-transform active:scale-[0.97]"
                      >
                        Approve
                      </button>
                    </div>
                  </form>
                  <form className="flex flex-col gap-1">
                    <input type="hidden" name="application_id" value={application.id} />
                    <label className="flex flex-col gap-1">
                      <span className="text-xs uppercase text-neutral-400">
                        Reject — reason (required)
                      </span>
                      <div className="flex gap-2">
                        <input
                          name="reason"
                          required
                          className="flex-1 rounded border px-3 py-1.5 text-sm"
                          placeholder="e.g. tone is off, missing my NEA project"
                        />
                        <button
                          formAction={rejectApplication}
                          className="rounded border px-3 py-1.5 text-sm text-red-600 transition-transform active:scale-[0.97]"
                        >
                          Reject
                        </button>
                      </div>
                    </label>
                  </form>
                </div>
              )}

              {application.stage === "approved" && (
                <div className="mt-3 flex flex-col gap-3 text-sm">
                  <p className="text-xs text-neutral-400">
                    Approved {application.approved_at && new Date(application.approved_at).toLocaleString()}
                  </p>
                  <div>
                    <h3 className="text-xs uppercase text-neutral-400">Final CV</h3>
                    <pre className="mt-1 max-h-64 overflow-y-auto whitespace-pre-wrap rounded bg-neutral-50 p-3 text-xs dark:bg-neutral-900">
                      {application.drafted_cv}
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-xs uppercase text-neutral-400">Final cover letter</h3>
                    <pre className="mt-1 max-h-64 overflow-y-auto whitespace-pre-wrap rounded bg-neutral-50 p-3 text-xs dark:bg-neutral-900">
                      {application.drafted_cover_letter}
                    </pre>
                  </div>
                  {vacancy.apply_url && (
                    <a
                      href={vacancy.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline"
                    >
                      Apply directly on the employer/Find an Apprenticeship page →
                    </a>
                  )}
                  <form>
                    <input type="hidden" name="application_id" value={application.id} />
                    <button
                      formAction={markSubmitted}
                      className="self-start rounded border px-3 py-1.5 text-sm transition-transform active:scale-[0.97]"
                    >
                      Mark as submitted
                    </button>
                  </form>
                </div>
              )}

              {application.stage === "submitted" && (
                <p className="mt-3 text-sm text-neutral-500">
                  Submitted {application.submitted_at && new Date(application.submitted_at).toLocaleString()}
                </p>
              )}

              {(application.stage === "saved" || application.stage === "ready_for_review") &&
                vacancy.apply_url && (
                  <a
                    href={vacancy.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm underline"
                  >
                    View on Find an Apprenticeship
                  </a>
                )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
