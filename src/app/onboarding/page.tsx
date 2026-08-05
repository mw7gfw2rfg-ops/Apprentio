import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Tell us about you</h1>
        <p className="text-sm text-neutral-500">
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

      <div className="flex flex-col gap-3 border-t pt-6">
        <div>
          <h2 className="text-lg font-medium">Base documents</h2>
          <p className="text-sm text-neutral-500">
            Your unmodified CV and cover letter — PDF or plain text, up to 5MB. Drafts
            are tailored from these.
          </p>
        </div>
        {uploaded && <p className="text-sm text-green-600">Uploaded.</p>}
        <form className="flex flex-col gap-4" encType="multipart/form-data">
          <label className="flex flex-col gap-1 text-sm">
            CV {cvUrl && (
              <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                (view current)
              </a>
            )}
            <input
              type="file"
              name="cv_file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Cover letter {coverLetterUrl && (
              <a href={coverLetterUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                (view current)
              </a>
            )}
            <input
              type="file"
              name="cover_letter_file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="text-sm"
            />
          </label>
          <button
            formAction={uploadBaseDocuments}
            className="self-start rounded border px-3 py-2 text-sm transition-transform active:scale-[0.97]"
          >
            Upload
          </button>
        </form>
      </div>
    </main>
  );
}
