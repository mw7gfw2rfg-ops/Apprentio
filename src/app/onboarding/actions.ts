"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GRADE_OPTIONS, SECTOR_OPTIONS } from "./constants";

function parseJsonArray(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function parseGradeMap(
  raw: FormDataEntryValue | null,
  subjects: string[]
): Record<string, string> {
  if (typeof raw !== "string") return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null) return {};
  const entries = Object.entries(parsed as Record<string, unknown>).filter(
    (entry): entry is [string, string] =>
      subjects.includes(entry[0]) &&
      typeof entry[1] === "string" &&
      (GRADE_OPTIONS as readonly string[]).includes(entry[1])
  );
  return Object.fromEntries(entries);
}

export async function saveOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const subjects = parseJsonArray(formData.get("subjects_json")).filter(
    (s) => s.trim().length > 0
  );
  const grades = parseGradeMap(formData.get("grades_json"), subjects);
  const predictedGrades = parseGradeMap(
    formData.get("predicted_grades_json"),
    subjects
  );
  const sectorsOfInterest = formData
    .getAll("sectors")
    .filter(
      (s): s is string =>
        typeof s === "string" && (SECTOR_OPTIONS as readonly string[]).includes(s)
    );
  const postcode = (formData.get("postcode") as string | null)?.trim() ?? "";
  const maxCommuteMinutes = Number(formData.get("max_commute_minutes"));
  const rightToWorkRaw = formData.get("right_to_work");
  const fullName = (formData.get("full_name") as string | null)?.trim() ?? "";
  const schoolYear = (formData.get("school_year") as string | null)?.trim() ?? "";
  const securityClearanceRaw = formData.get("security_clearance_eligible");
  const minimumApprenticeshipLevel = Number(
    formData.get("minimum_apprenticeship_level")
  );

  const errors: string[] = [];
  if (!fullName) errors.push("Full name is required");
  if (!schoolYear) errors.push("School year is required");
  if (subjects.length === 0) errors.push("Add at least one subject");
  if (sectorsOfInterest.length === 0) errors.push("Pick at least one sector");
  if (!postcode) errors.push("Postcode is required");
  if (!Number.isFinite(maxCommuteMinutes) || maxCommuteMinutes <= 0)
    errors.push("Pick a commute radius");
  if (rightToWorkRaw !== "yes" && rightToWorkRaw !== "no")
    errors.push("Right-to-work status is required");
  if (
    !Number.isInteger(minimumApprenticeshipLevel) ||
    minimumApprenticeshipLevel < 2 ||
    minimumApprenticeshipLevel > 7
  )
    errors.push("Pick a minimum apprenticeship level");

  const returnTo = (formData.get("return_to") as string | null) || "/onboarding";
  const isInitialSetup = returnTo === "/onboarding";

  if (errors.length > 0) {
    redirect(`${returnTo}?error=${encodeURIComponent(errors.join("; "))}`);
  }

  const securityClearanceEligible =
    securityClearanceRaw === "yes"
      ? true
      : securityClearanceRaw === "no"
        ? false
        : null;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      school_year: schoolYear,
      subjects,
      grades,
      predicted_grades: predictedGrades,
      sectors_of_interest: sectorsOfInterest,
      max_commute_minutes: maxCommuteMinutes,
      postcode,
      right_to_work: rightToWorkRaw === "yes",
      security_clearance_eligible: securityClearanceEligible,
      minimum_apprenticeship_level: minimumApprenticeshipLevel,
      onboarding_complete: true,
    })
    .eq("user_id", user.id);

  if (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(isInitialSetup ? "/dashboard" : `${returnTo}?success=1`);
}
