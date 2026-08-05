import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateApplicationStatus } from "./actions";
import { ALLOWED_STATUS_TRANSITIONS } from "./constants";

const STAGES = [
  { key: "saved", label: "Saved" },
  { key: "drafting", label: "Drafting" },
  { key: "ready_for_review", label: "Ready for review" },
  { key: "approved", label: "Approved" },
  { key: "submitted", label: "Submitted" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
  { key: "rejected", label: "Rejected" },
  { key: "withdrawn", label: "Withdrawn" },
] as const;

const STAGE_LABELS: Record<string, string> = Object.fromEntries(
  STAGES.map((stage) => [stage.key, stage.label])
);

type BoardApplication = {
  id: string;
  stage: string;
  approved_at: string | null;
  submitted_at: string | null;
  vacancies: {
    employer_name: string;
    role_title: string;
    closing_date: string | null;
    apply_url: string | null;
  } | null;
};

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("user_id", user.id)
    .single();

  if (!profile?.onboarding_complete) {
    redirect("/onboarding");
  }

  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, stage, approved_at, submitted_at, vacancies(employer_name, role_title, closing_date, apply_url)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<BoardApplication[]>();

  const byStage = new Map<string, BoardApplication[]>();
  for (const stage of STAGES) byStage.set(stage.key, []);
  for (const application of applications ?? []) {
    if (!application.vacancies) continue;
    byStage.get(application.stage)?.push(application);
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 px-4 py-16">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="text-2xl font-semibold">Application board</h1>
        <p className="text-sm text-neutral-500">
          Every saved application, grouped by stage.
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="mx-auto flex w-full max-w-6xl gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const cards = byStage.get(stage.key) ?? [];
          return (
            <div key={stage.key} className="flex w-64 shrink-0 flex-col gap-3">
              <h2 className="text-xs font-medium uppercase text-neutral-500">
                {stage.label} <span className="text-neutral-400">({cards.length})</span>
              </h2>
              <div className="flex flex-col gap-3">
                {cards.map((application) => {
                  const vacancy = application.vacancies!;
                  return (
                    <div key={application.id} className="rounded border p-3 text-sm">
                      <p className="font-medium">{vacancy.role_title}</p>
                      <p className="text-xs text-neutral-500">{vacancy.employer_name}</p>

                      {stage.key === "saved" && vacancy.closing_date && (
                        <p className="mt-1 text-xs text-neutral-400">
                          Closes {vacancy.closing_date}
                        </p>
                      )}
                      {stage.key === "approved" && application.approved_at && (
                        <p className="mt-1 text-xs text-neutral-400">
                          Approved {new Date(application.approved_at).toLocaleDateString()}
                        </p>
                      )}
                      {stage.key === "submitted" && application.submitted_at && (
                        <p className="mt-1 text-xs text-neutral-400">
                          Submitted {new Date(application.submitted_at).toLocaleDateString()}
                        </p>
                      )}

                      {["saved", "ready_for_review", "approved"].includes(stage.key) && (
                        <Link
                          href={`/applications#application-${application.id}`}
                          className="mt-2 inline-block text-xs underline"
                        >
                          Manage →
                        </Link>
                      )}

                      {ALLOWED_STATUS_TRANSITIONS[stage.key] && (
                        <form className="mt-2 flex flex-col gap-1">
                          <input
                            type="hidden"
                            name="application_id"
                            value={application.id}
                          />
                          <select
                            name="new_stage"
                            defaultValue=""
                            className="rounded border px-2 py-1 text-xs"
                          >
                            <option value="" disabled>
                              Update status…
                            </option>
                            {ALLOWED_STATUS_TRANSITIONS[stage.key].map((target) => (
                              <option key={target} value={target}>
                                {STAGE_LABELS[target]}
                              </option>
                            ))}
                          </select>
                          <button
                            formAction={updateApplicationStatus}
                            className="self-start rounded border px-2 py-1 text-xs transition-transform active:scale-[0.97]"
                          >
                            Update
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
                {cards.length === 0 && (
                  <p className="text-xs text-neutral-400">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
