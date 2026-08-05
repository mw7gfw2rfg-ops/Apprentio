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
