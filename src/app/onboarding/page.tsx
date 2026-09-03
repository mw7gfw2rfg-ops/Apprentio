import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnimatedPage } from "@/components/AnimatedPage";
import OnboardingForm from "./OnboardingForm";
import type { SubjectRow } from "./constants";

const BUCKET = "base-documents";

export default async function OnboardingPage({
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
          cvUrl={cvUrl}
          coverLetterUrl={coverLetterUrl}
        />
      </AnimatedPage>
    </main>
  );
}
