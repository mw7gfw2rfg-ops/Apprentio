import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchVacancyDetail } from "@/lib/vacancies/detail";
import { getCachedEmployerResearch } from "@/lib/drafting/employer-research";
import { getBaseCvText } from "@/lib/matching/cv-text-cache";
import { extractVacancyKeywords, prepareCvForMatching, scoreMatch } from "@/lib/matching/match-score";
import { VacancyDetailContent } from "@/components/vacancy-detail-content";
import type { StudentGradeProfile } from "@/lib/vacancies/grade-match";
import { saveVacancy } from "../../discovery/actions";

export default async function VacancyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
      "onboarding_complete, subscription_tier, base_cv_storage_path, base_cv_extracted_text, subjects, grades, predicted_grades"
    )
    .eq("user_id", user.id)
    .single();

  if (!profile?.onboarding_complete) {
    redirect("/onboarding");
  }

  const studentGrades: StudentGradeProfile = {
    subjects: profile.subjects ?? [],
    grades: (profile.grades as Record<string, string> | null) ?? {},
    predictedGrades: (profile.predicted_grades as Record<string, string> | null) ?? {},
  };

  const vacancy = await fetchVacancyDetail(supabase, id);

  if (!vacancy) {
    notFound();
  }

  const { data: savedRow } = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", user.id)
    .eq("vacancy_id", vacancy.id)
    .maybeSingle();
  const isSaved = !!savedRow;
  const employerResearch = await getCachedEmployerResearch(vacancy.employer_name);

  const cvText = await getBaseCvText(
    supabase,
    user.id,
    profile.base_cv_storage_path,
    profile.base_cv_extracted_text
  );
  const matchScore = cvText
    ? scoreMatch(
        prepareCvForMatching(cvText),
        extractVacancyKeywords({
          source: vacancy.source,
          rawJson: vacancy.raw_json,
          description: vacancy.description,
        })
      )
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-16">
      <Link href="/discovery" className="text-sm text-primary hover:underline">
        ← Back to Discover
      </Link>

      <VacancyDetailContent
        vacancy={vacancy}
        isSaved={isSaved}
        saveAction={saveVacancy}
        employerResearch={employerResearch}
        matchScore={matchScore}
        hasCv={!!cvText}
        showUpgradeNudge={profile.subscription_tier !== "premium"}
        studentGrades={studentGrades}
      />
    </main>
  );
}
