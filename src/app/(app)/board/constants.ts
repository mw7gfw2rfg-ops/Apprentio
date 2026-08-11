// Manual, post-submission outcomes — these happen outside the app (an
// employer calls, emails, or goes quiet) so someone has to tell the board.
// Keyed by current stage -> the stages it's allowed to move to from there.
// Any stage not listed here (saved, drafting, ready_for_review, approved,
// offer, rejected, withdrawn) can't be touched by this action at all — it's
// an allow-list per source stage, not a general stage-jumper.
export const ALLOWED_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  submitted: ["interview", "offer", "rejected", "withdrawn"],
  interview: ["offer", "rejected", "withdrawn"],
};

export const STAGES = [
  { key: "saved", label: "Saved", dot: "bg-neutral-400 dark:bg-neutral-600" },
  { key: "drafting", label: "Drafting", dot: "bg-neutral-400 dark:bg-neutral-600" },
  { key: "ready_for_review", label: "Ready for review", dot: "bg-amber-500 dark:bg-amber-400" },
  { key: "approved", label: "Approved", dot: "bg-primary" },
  { key: "submitted", label: "Submitted", dot: "bg-primary" },
  { key: "interview", label: "Interview", dot: "bg-violet-500 dark:bg-violet-400" },
  { key: "offer", label: "Offer", dot: "bg-emerald-500 dark:bg-emerald-400" },
  { key: "rejected", label: "Rejected", dot: "bg-neutral-400 dark:bg-neutral-600" },
  { key: "withdrawn", label: "Withdrawn", dot: "bg-neutral-400 dark:bg-neutral-600" },
] as const;

export const STAGE_LABELS: Record<string, string> = Object.fromEntries(
  STAGES.map((stage) => [stage.key, stage.label])
);

export const STAGE_DOTS: Record<string, string> = Object.fromEntries(
  STAGES.map((stage) => [stage.key, stage.dot])
);

// Display-only grouping of the 9 real stages into 6 board columns, so the
// board renders on a phone without 9 fighting-for-space lanes. Purely
// visual: it does not change application_stage, ALLOWED_STATUS_TRANSITIONS,
// or any other stage logic, which all still key off the real per-card
// stage. "In progress" merges drafting + ready_for_review (both pre-approval,
// need-my-attention states); "Closed" merges offer/rejected/withdrawn (all
// terminal, post-submission outcomes) -- a card in either still shows its
// real specific stage as a badge, so no information is lost.
export const BOARD_COLUMNS = [
  { key: "saved", label: "Saved", dot: "bg-neutral-400 dark:bg-neutral-600", stages: ["saved"] },
  {
    key: "in_progress",
    label: "In progress",
    dot: "bg-amber-500 dark:bg-amber-400",
    stages: ["drafting", "ready_for_review"],
  },
  { key: "approved", label: "Approved", dot: "bg-primary", stages: ["approved"] },
  { key: "submitted", label: "Submitted", dot: "bg-primary", stages: ["submitted"] },
  { key: "interview", label: "Interview", dot: "bg-violet-500 dark:bg-violet-400", stages: ["interview"] },
  {
    key: "closed",
    label: "Closed",
    dot: "bg-neutral-400 dark:bg-neutral-600",
    stages: ["offer", "rejected", "withdrawn"],
  },
] as const;

export const STAGE_TO_COLUMN: Record<string, (typeof BOARD_COLUMNS)[number]["key"]> =
  Object.fromEntries(BOARD_COLUMNS.flatMap((column) => column.stages.map((stage) => [stage, column.key])));
