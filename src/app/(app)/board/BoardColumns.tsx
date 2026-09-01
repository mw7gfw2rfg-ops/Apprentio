"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { updateApplicationStatus } from "./actions";
import {
  ALLOWED_STATUS_TRANSITIONS,
  BOARD_COLUMNS,
  STAGE_DOTS,
  STAGE_LABELS,
  STAGE_TO_COLUMN,
} from "./constants";

export type BoardApplication = {
  id: string;
  stage: string;
  approved_at: string | null;
  submitted_at: string | null;
  vacancy_id: string | null;
  manual_employer_name: string | null;
  manual_role_title: string | null;
  manual_apply_url: string | null;
  manual_closing_date: string | null;
  vacancies: {
    employer_name: string;
    role_title: string;
    closing_date: string | null;
    apply_url: string | null;
  } | null;
};

export function BoardColumns({ applications }: { applications: BoardApplication[] }) {
  const reduceMotion = useReducedMotion();
  const byColumn = new Map<string, BoardApplication[]>();
  for (const column of BOARD_COLUMNS) byColumn.set(column.key, []);
  for (const application of applications) {
    const columnKey = STAGE_TO_COLUMN[application.stage];
    if (columnKey) byColumn.get(columnKey)?.push(application);
  }

  return (
    <LayoutGroup>
      <div className="mx-auto flex w-full max-w-7xl snap-x snap-mandatory gap-3 overflow-x-auto pb-4 md:grid md:grid-cols-6 md:snap-none md:gap-4 md:overflow-visible">
        {BOARD_COLUMNS.map((column) => {
          const cards = byColumn.get(column.key) ?? [];
          const isMerged = column.stages.length > 1;
          return (
            <motion.div
              key={column.key}
              layout
              className="flex w-[72vw] max-w-[260px] shrink-0 snap-start flex-col gap-3 md:w-auto md:max-w-none md:min-w-0 md:shrink"
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${column.dot}`} />
                <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {column.label}{" "}
                  <span className="text-muted-foreground/60">
                    ({cards.length})
                  </span>
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {cards.map((application) => {
                    const vacancy = {
                      role_title:
                        application.vacancies?.role_title ??
                        application.manual_role_title ??
                        "Untitled role",
                      employer_name:
                        application.vacancies?.employer_name ??
                        application.manual_employer_name ??
                        "Unknown employer",
                      closing_date:
                        application.vacancies?.closing_date ??
                        application.manual_closing_date,
                    };
                    const stage = application.stage;
                    return (
                      <motion.div
                        key={application.id}
                        layoutId={application.id}
                        layout
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        className="rounded-[16px_14px_17px_15px] border border-border bg-card p-3.5 text-sm shadow-[0_14px_26px_-22px_rgba(96,74,52,0.7)]"
                      >
                        <p className="font-extrabold leading-snug">{vacancy.role_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {vacancy.employer_name}
                        </p>

                        {isMerged && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STAGE_DOTS[stage]}`} />
                            <span className="text-[11px] font-bold text-muted-foreground">
                              {STAGE_LABELS[stage]}
                            </span>
                          </div>
                        )}

                        {stage === "saved" && vacancy.closing_date && (
                          <p className="mt-1 text-xs text-muted-foreground/70">
                            Closes {vacancy.closing_date}
                          </p>
                        )}
                        {stage === "approved" && application.approved_at && (
                          <p className="mt-1 text-xs text-muted-foreground/70">
                            Approved {new Date(application.approved_at).toLocaleDateString()}
                          </p>
                        )}
                        {stage === "submitted" && application.submitted_at && (
                          <p className="mt-1 text-xs text-muted-foreground/70">
                            Submitted{" "}
                            {new Date(application.submitted_at).toLocaleDateString()}
                          </p>
                        )}

                        {["saved", "ready_for_review", "approved"].includes(stage) && (
                          <Link
                            href={`/applications#application-${application.id}`}
                            className="mt-2 inline-block text-xs font-bold text-[var(--link)] hover:underline"
                          >
                            Manage →
                          </Link>
                        )}

                        {ALLOWED_STATUS_TRANSITIONS[stage] && (
                          <form className="mt-3 flex items-center gap-1.5 border-t border-border pt-2">
                            <input
                              type="hidden"
                              name="application_id"
                              value={application.id}
                            />
                            <select
                              name="new_stage"
                              defaultValue=""
                              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-1.5 py-1 text-xs"
                            >
                              <option value="" disabled>
                                Update status…
                              </option>
                              {ALLOWED_STATUS_TRANSITIONS[stage].map((target) => (
                                <option key={target} value={target}>
                                  {STAGE_LABELS[target]}
                                </option>
                              ))}
                            </select>
                            <button
                              formAction={updateApplicationStatus}
                              className="shrink-0 rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-[0_2px_0_var(--shadow-accent)] transition-transform active:translate-y-px"
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
                  <p className="text-xs text-muted-foreground/50">—</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
