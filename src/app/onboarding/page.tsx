import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnimatedPage } from "@/components/AnimatedPage";
import OnboardingForm from "./OnboardingForm";
import { uploadBaseDocuments } from "./documents-actions";
import type { SubjectRow } from "./constants";

const BUCKET = "base-documents";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; uploaded?: string }>;
}) {
  const { error, uploaded } = await searchParams;
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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-10 px-4 py-16">
      <AnimatedPage className="flex flex-col gap-10">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Tell us about you</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            This drives which apprenticeships you&apos;re matched to.
          </p>
        </div>

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
        />

        <div className="flex flex-col gap-4 rounded-[24px_20px_26px_22px] border border-border bg-card p-6 shadow-[0_24px_42px_-30px_rgba(96,74,52,0.5)]">
          <div>
            <h2 className="font-heading text-lg font-bold">
              Base documents
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your unmodified CV and cover letter — PDF or plain text, up to 5MB. Drafts
              are tailored from these.
            </p>
          </div>
          {uploaded && (
            <p className="text-sm font-bold text-[var(--warm-sage-foreground)]">
              Uploaded.
            </p>
          )}
          <form className="flex flex-col gap-4" encType="multipart/form-data">
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
      </AnimatedPage>
    </main>
  );
}
