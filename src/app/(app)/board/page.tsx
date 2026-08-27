import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/profile";
import { BoardColumns, type BoardApplication } from "./BoardColumns";

export default async function BoardPage({
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

  const profile = await requireProfile<{ onboarding_complete: boolean }>(
    supabase,
    user.id,
    "onboarding_complete"
  );

  if (!profile.onboarding_complete) {
    redirect("/onboarding");
  }

  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, stage, approved_at, submitted_at, vacancy_id, manual_employer_name, manual_role_title, manual_apply_url, manual_closing_date, vacancies(employer_name, role_title, closing_date, apply_url)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<BoardApplication[]>();

  return (
    <main className="flex min-h-screen flex-col gap-6 px-4 py-16">
      <div className="mx-auto w-full max-w-7xl">
        <h1 className="text-3xl font-semibold tracking-tight">Application board</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Every saved application, grouped by stage.
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <BoardColumns applications={applications ?? []} />
    </main>
  );
}
