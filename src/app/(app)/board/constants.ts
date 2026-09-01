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

// Semantic status colors, deliberately distinct from the user's chosen
// accent -- they map 1:1 onto the redesign's own chart-1..5 tokens (see
// globals.css) so a "warm" palette pass didn't have to invent new hues.
const NEUTRAL_DOT = "bg-[var(--warm-tan-border)]";
const AMBER_DOT = "bg-chart-5";
const PRIMARY_DOT = "bg-chart-1";
const VIOLET_DOT = "bg-chart-2";
const EMERALD_DOT = "bg-chart-3";

export const STAGES = [
  { key: "saved", label: "Saved", dot: NEUTRAL_DOT },
  { key: "drafting", label: "Drafting", dot: NEUTRAL_DOT },
  { key: "ready_for_review", label: "Ready for review", dot: AMBER_DOT },
  { key: "approved", label: "Approved", dot: PRIMARY_DOT },
  { key: "submitted", label: "Submitted", dot: PRIMARY_DOT },
  { key: "interview", label: "Interview", dot: VIOLET_DOT },
  { key: "offer", label: "Offer", dot: EMERALD_DOT },
  { key: "rejected", label: "Rejected", dot: NEUTRAL_DOT },
  { key: "withdrawn", label: "Withdrawn", dot: NEUTRAL_DOT },
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
  { key: "saved", label: "Saved", dot: NEUTRAL_DOT, stages: ["saved"] },
  {
    key: "in_progress",
    label: "In progress",
    dot: AMBER_DOT,
    stages: ["drafting", "ready_for_review"],
  },
  { key: "approved", label: "Approved", dot: PRIMARY_DOT, stages: ["approved"] },
  { key: "submitted", label: "Submitted", dot: PRIMARY_DOT, stages: ["submitted"] },
  { key: "interview", label: "Interview", dot: VIOLET_DOT, stages: ["interview"] },
  {
    key: "closed",
    label: "Closed",
    dot: NEUTRAL_DOT,
    stages: ["offer", "rejected", "withdrawn"],
  },
] as const;

export const STAGE_TO_COLUMN: Record<string, (typeof BOARD_COLUMNS)[number]["key"]> =
  Object.fromEntries(BOARD_COLUMNS.flatMap((column) => column.stages.map((stage) => [stage, column.key])));
