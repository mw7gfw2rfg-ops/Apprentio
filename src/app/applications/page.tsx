import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { draftApplication } from "./actions";

type ApplicationRow = {
  id: string;
  stage: string;
  drafted_cv: string | null;
  drafted_cover_letter: string | null;
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
      "onboarding_complete, subscription_tier, base_cv_storage_path, base_cover_letter_storage_path"
    )
    .eq("user_id", user.id)
    .single();

  if (!profile?.onboarding_complete) {
    redirect("/onboarding");
  }

  const isPremium = profile.subscription_tier === "premium";
  const hasBaseDocuments = Boolean(
    profile.base_cv_storage_path && profile.base_cover_letter_storage_path
  );

  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, stage, drafted_cv, drafted_cover_letter, vacancies(employer_name, role_title, apply_url, closing_date)"
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
            <li key={application.id} className="rounded border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium">{vacancy.role_title}</h2>
                  <p className="text-sm text-neutral-500">{vacancy.employer_name}</p>
                </div>
                <span className="rounded-full border px-2 py-0.5 text-xs uppercase text-neutral-500">
                  {application.stage.replace("_", " ")}
                </span>
              </div>

              {application.stage === "saved" && (
                <div className="mt-3">
                  {!isPremium && (
                    <button
                      type="button"
                      disabled
                      title="Upgrade to premium to unlock AI drafting"
                      className="rounded border px-3 py-1.5 text-sm opacity-50"
                    >
                      Upgrade to draft a tailored CV & cover letter for this application
                    </button>
                  )}
                  {isPremium && !hasBaseDocuments && (
                    <p className="text-sm text-red-600">
                      Upload your base CV and cover letter in your profile before drafting.
                    </p>
                  )}
                  {isPremium && hasBaseDocuments && (
                    <form>
                      <input type="hidden" name="application_id" value={application.id} />
                      <button
                        formAction={draftApplication}
                        className="rounded border px-3 py-1.5 text-sm transition-transform active:scale-[0.97]"
                      >
                        Draft
                      </button>
                    </form>
                  )}
                </div>
              )}

              {application.stage === "ready_for_review" && (
                <div className="mt-3 flex flex-col gap-3 text-sm">
                  <div>
                    <h3 className="text-xs uppercase text-neutral-400">Tailored CV</h3>
                    <pre className="mt-1 max-h-64 overflow-y-auto whitespace-pre-wrap rounded bg-neutral-50 p-3 text-xs dark:bg-neutral-900">
                      {application.drafted_cv}
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-xs uppercase text-neutral-400">Tailored cover letter</h3>
                    <pre className="mt-1 max-h-64 overflow-y-auto whitespace-pre-wrap rounded bg-neutral-50 p-3 text-xs dark:bg-neutral-900">
                      {application.drafted_cover_letter}
                    </pre>
                  </div>
                </div>
              )}

              {vacancy.apply_url && (
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
