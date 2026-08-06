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
  { key: "approved", label: "Approved", dot: "bg-indigo-500 dark:bg-indigo-400" },
  { key: "submitted", label: "Submitted", dot: "bg-indigo-500 dark:bg-indigo-400" },
  { key: "interview", label: "Interview", dot: "bg-violet-500 dark:bg-violet-400" },
  { key: "offer", label: "Offer", dot: "bg-emerald-500 dark:bg-emerald-400" },
  { key: "rejected", label: "Rejected", dot: "bg-neutral-400 dark:bg-neutral-600" },
  { key: "withdrawn", label: "Withdrawn", dot: "bg-neutral-400 dark:bg-neutral-600" },
] as const;

export const STAGE_LABELS: Record<string, string> = Object.fromEntries(
  STAGES.map((stage) => [stage.key, stage.label])
);
