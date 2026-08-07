"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchVacancyDetail, type VacancyDetail } from "@/lib/vacancies/detail";
import { getCachedEmployerResearch, type EmployerResearch } from "@/lib/drafting/employer-research";

const UNIQUE_VIOLATION = "23505";

// Called client-side from the Discovery split-pane when a result is
// selected on desktop, so the detail pane can render without navigating
// away from /discovery. Returns the same shape /vacancies/[id] renders, so
// the pane and the dedicated page never drift apart -- including whatever
// employer research is already cached (read-only here; a fresh search only
// ever runs from the draft action, never from browsing).
export async function getVacancyDetail(
  vacancyId: string
): Promise<{ vacancy: VacancyDetail; isSaved: boolean; employerResearch: EmployerResearch | null } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const vacancy = await fetchVacancyDetail(supabase, vacancyId);
  if (!vacancy) return null;

  const [{ data: savedRow }, employerResearch] = await Promise.all([
    supabase
      .from("applications")
      .select("id")
      .eq("user_id", user.id)
      .eq("vacancy_id", vacancyId)
      .maybeSingle(),
    getCachedEmployerResearch(vacancy.employer_name),
  ]);

  return { vacancy, isSaved: !!savedRow, employerResearch };
}

export async function saveVacancy(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const vacancyId = formData.get("vacancy_id");
  if (typeof vacancyId !== "string" || !vacancyId) {
    redirect("/discovery?error=Missing vacancy");
  }

  const { error } = await supabase
    .from("applications")
    .insert({ user_id: user.id, vacancy_id: vacancyId, stage: "saved" });

  if (error && error.code !== UNIQUE_VIOLATION) {
    redirect(`/discovery?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/discovery");
  revalidatePath(`/vacancies/${vacancyId}`);
}
