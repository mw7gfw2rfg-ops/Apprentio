// Interview prep is available from submission onward, not just the
// 'interview' stage -- a student should be able to prep for the online
// tests / assessment centre stage that (for most employers) sits between
// submission and an actual interview invite, and the content stays useful
// even at offer/rejected/withdrawn since it's a reference, not a live tool.
export const INTERVIEW_PREP_STAGES = [
  "submitted",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export type InterviewPrepFormat = "online_tests" | "video_interview" | "assessment_centre" | "panel_interview";

export const PREP_FORMATS: { value: InterviewPrepFormat; label: string }[] = [
  { value: "online_tests", label: "Online tests" },
  { value: "video_interview", label: "Video interview" },
  { value: "assessment_centre", label: "Assessment centre" },
  { value: "panel_interview", label: "Panel interview" },
];

// Only these two formats get AI-generated questions -- Online tests and
// Assessment centre are format explainers (what the exercise *is*), not
// question-and-answer formats you can usefully pre-generate content for.
export const AI_ELIGIBLE_FORMATS: InterviewPrepFormat[] = ["video_interview", "panel_interview"];
