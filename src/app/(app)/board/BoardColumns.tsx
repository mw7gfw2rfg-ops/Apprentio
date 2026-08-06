"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { updateApplicationStatus } from "./actions";
import { ALLOWED_STATUS_TRANSITIONS, STAGE_LABELS, STAGES } from "./constants";

export type BoardApplication = {
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

export function BoardColumns({ applications }: { applications: BoardApplication[] }) {
  const reduceMotion = useReducedMotion();
  const byStage = new Map<string, BoardApplication[]>();
  for (const stage of STAGES) byStage.set(stage.key, []);
  for (const application of applications) {
    if (!application.vacancies) continue;
    byStage.get(application.stage)?.push(application);
  }

  return (
    <LayoutGroup>
      <div className="mx-auto flex w-full max-w-6xl gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const cards = byStage.get(stage.key) ?? [];
          return (
            <motion.div
              key={stage.key}
              layout
              className="flex w-72 shrink-0 flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${stage.dot}`} />
                <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {stage.label}{" "}
                  <span className="text-neutral-400 dark:text-neutral-600">
                    ({cards.length})
                  </span>
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {cards.map((application) => {
                    const vacancy = application.vacancies!;
                    return (
                      <motion.div
                        key={application.id}
                        layoutId={application.id}
                        layout
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        className="rounded-lg border border-neutral-200 bg-white p-3 text-sm shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                      >
                        <p className="font-medium leading-snug">{vacancy.role_title}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {vacancy.employer_name}
                        </p>

                        {stage.key === "saved" && vacancy.closing_date && (
                          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                            Closes {vacancy.closing_date}
                          </p>
                        )}
                        {stage.key === "approved" && application.approved_at && (
                          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                            Approved {new Date(application.approved_at).toLocaleDateString()}
                          </p>
                        )}
                        {stage.key === "submitted" && application.submitted_at && (
                          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                            Submitted{" "}
                            {new Date(application.submitted_at).toLocaleDateString()}
                          </p>
                        )}

                        {["saved", "ready_for_review", "approved"].includes(stage.key) && (
                          <Link
                            href={`/applications#application-${application.id}`}
                            className="mt-2 inline-block text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            Manage →
                          </Link>
                        )}

                        {ALLOWED_STATUS_TRANSITIONS[stage.key] && (
                          <form className="mt-3 flex items-center gap-1.5 border-t border-neutral-100 pt-2 dark:border-neutral-800">
                            <input
                              type="hidden"
                              name="application_id"
                              value={application.id}
                            />
                            <select
                              name="new_stage"
                              defaultValue=""
                              className="min-w-0 flex-1 rounded border border-neutral-200 px-1.5 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
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
                              className="shrink-0 rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white transition-all hover:bg-indigo-500 active:scale-[0.97] dark:bg-indigo-500 dark:hover:bg-indigo-400"
                            >
                              Go
                            </button>
                          </form>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {cards.length === 0 && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-600">—</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
