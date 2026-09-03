import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "@/app/onboarding/OnboardingForm";
import { uploadBaseDocuments } from "@/app/onboarding/documents-actions";
import type { SubjectRow } from "@/app/onboarding/constants";

const BUCKET = "base-documents";
const RETURN_TO = "/profile";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; uploaded?: string }>;
}) {
  const { error, success, uploaded } = await searchParams;
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
      "full_name, school_year, subjects, grades, predicted_grades, sectors_of_interest, postcode, max_commute_minutes, right_to_work, security_clearance_eligible, minimum_apprenticeship_level, base_cv_storage_path, base_cover_letter_storage_path"
    )
    .eq("user_id", user.id)
    .single();

  const [cvUrl, coverLetterUrl] = await Promise.all([
    profile?.base_cv_storage_path
      ? supabase.storage
          .from(BUCKET)
          .createSignedUrl(profile.base_cv_storage_path, 60)
          .then((r) => r.data?.signedUrl ?? null)
      : Promise.resolve(null),
    profile?.base_cover_letter_storage_path
      ? supabase.storage
          .from(BUCKET)
          .createSignedUrl(profile.base_cover_letter_storage_path, 60)
          .then((r) => r.data?.signedUrl ?? null)
      : Promise.resolve(null),
  ]);

  const subjects = profile?.subjects ?? [];
  const grades = (profile?.grades ?? {}) as Record<string, string>;
  const predictedGrades = (profile?.predicted_grades ?? {}) as Record<string, string>;
  const initialSubjects: SubjectRow[] = subjects.map((subject: string) => ({
    subject,
    grade: grades[subject] ?? "",
    predictedGrade: predictedGrades[subject] ?? "",
  }));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-10">
      {success && (
        <p className="rounded-2xl border border-[var(--warm-sage-border)] bg-[var(--warm-sage)] px-4 py-3 text-sm font-semibold text-[var(--warm-sage-foreground)]">
          Saved.
        </p>
      )}

      <OnboardingForm
        initialFullName={profile?.full_name ?? ""}
        initialSchoolYear={profile?.school_year ?? ""}
        initialSubjects={initialSubjects}
        initialSectors={profile?.sectors_of_interest ?? []}
        initialPostcode={profile?.postcode ?? ""}
        initialMaxCommuteMinutes={profile?.max_commute_minutes ?? null}
        initialRightToWork={profile?.right_to_work ?? null}
        initialSecurityClearanceEligible={profile?.security_clearance_eligible ?? null}
        initialMinimumApprenticeshipLevel={profile?.minimum_apprenticeship_level ?? null}
        error={error}
        returnTo={RETURN_TO}
      />

      <div className="flex flex-col gap-4 rounded-[24px_20px_26px_22px] border border-border bg-card p-6 shadow-[0_24px_42px_-30px_rgba(96,74,52,0.5)]">
        <div>
          <h2 className="font-heading text-lg font-bold">Base documents</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your unmodified CV and cover letter — PDF or plain text, up to 5MB. Drafts
            are tailored from these.
          </p>
        </div>
        {uploaded && (
          <p className="text-sm font-bold text-[var(--warm-sage-foreground)]">Uploaded.</p>
        )}
        <form className="flex flex-col gap-4" encType="multipart/form-data">
          <input type="hidden" name="return_to" value={RETURN_TO} />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-bold text-foreground">
              CV{" "}
              {cvUrl && (
                <a
                  href={cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-normal text-[var(--link)] hover:underline"
                >
                  (view current)
                </a>
              )}
            </span>
            <input
              type="file"
              name="cv_file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-bold text-foreground">
              Cover letter{" "}
              {coverLetterUrl && (
                <a
                  href={coverLetterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-normal text-[var(--link)] hover:underline"
                >
                  (view current)
                </a>
              )}
            </span>
            <input
              type="file"
              name="cover_letter_file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-foreground"
            />
          </label>
          <button
            formAction={uploadBaseDocuments}
            className="self-start rounded-xl border border-border px-4 py-2 text-sm font-bold transition-colors hover:bg-accent active:translate-y-px"
          >
            Upload
          </button>
        </form>
      </div>
    </main>
  );
}
