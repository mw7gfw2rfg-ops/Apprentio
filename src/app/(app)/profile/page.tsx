import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "@/app/onboarding/OnboardingForm";
import type { SubjectRow } from "@/app/onboarding/constants";

const BUCKET = "base-documents";
const RETURN_TO = "/profile";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
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
        cvUrl={cvUrl}
        coverLetterUrl={coverLetterUrl}
      />
    </main>
  );
}
