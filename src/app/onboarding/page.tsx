import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "./OnboardingForm";
import type { SubjectRow } from "./constants";

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
      "subjects, grades, predicted_grades, sectors_of_interest, postcode, max_commute_minutes, right_to_work"
    )
    .eq("user_id", user.id)
    .single();

  const subjects = profile?.subjects ?? [];
  const grades = (profile?.grades ?? {}) as Record<string, string>;
  const predictedGrades = (profile?.predicted_grades ?? {}) as Record<string, string>;
  const initialSubjects: SubjectRow[] = subjects.map((subject: string) => ({
    subject,
    grade: grades[subject] ?? "",
    predictedGrade: predictedGrades[subject] ?? "",
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Tell us about you</h1>
        <p className="text-sm text-neutral-500">
          This drives which apprenticeships you&apos;re matched to.
        </p>
      </div>
      <OnboardingForm
        initialSubjects={initialSubjects}
        initialSectors={profile?.sectors_of_interest ?? []}
        initialPostcode={profile?.postcode ?? ""}
        initialMaxCommuteMinutes={profile?.max_commute_minutes ?? null}
        initialRightToWork={profile?.right_to_work ?? null}
        error={error}
      />
    </main>
  );
}
