export type ReadinessStep = {
  key: string;
  label: string;
  done: boolean;
};

export type Readiness = {
  steps: ReadinessStep[];
  completed: number;
  total: number;
};

// Zero-cost signal, derived entirely from data Apprentio already stores --
// no AI call, no new tracking table. "Interview prep engaged" is backed by
// real interview_practice_attempts rows (an actual recorded practice
// answer), not just having opened the prep dialog, since opening the
// dialog isn't persisted anywhere.
//
// Steps that genuinely don't apply yet are omitted from the list entirely
// rather than shown as an outstanding failure: drafting steps for manual
// entries (no AI drafting is ever available on them, per PLAN.md), and
// "Interview prep engaged" before the application has even reached a stage
// where prep is offered. Omitting keeps the indicator from ever reading as
// permanently broken/incomplete for a step that was never actually on
// offer for that application.
export function computeReadiness({
  isManual,
  hasBaseDocuments,
  isApproved,
  isSubmitted,
  interviewPrepAvailable,
  hasPracticeAttempt,
}: {
  isManual: boolean;
  hasBaseDocuments: boolean;
  isApproved: boolean;
  isSubmitted: boolean;
  interviewPrepAvailable: boolean;
  hasPracticeAttempt: boolean;
}): Readiness {
  const steps: ReadinessStep[] = [];

  if (!isManual) {
    steps.push({
      key: "base_documents",
      label: "Base CV & cover letter uploaded",
      done: hasBaseDocuments,
    });
    steps.push({ key: "draft_approved", label: "Draft approved", done: isApproved });
  }

  steps.push({ key: "submitted", label: "Submitted", done: isSubmitted });

  if (interviewPrepAvailable) {
    steps.push({
      key: "interview_prep",
      label: "Interview prep engaged",
      done: hasPracticeAttempt,
    });
  }

  return {
    steps,
    completed: steps.filter((s) => s.done).length,
    total: steps.length,
  };
}
