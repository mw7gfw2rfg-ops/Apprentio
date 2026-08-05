export const GRADE_OPTIONS = ["A*", "A", "B", "C", "D", "E", "U"] as const;

export const SECTOR_OPTIONS = [
  "Cybersecurity",
  "Software Engineering",
  "Data & AI",
  "Finance & Professional Services",
  "Engineering",
  "Government & Defence",
  "Consulting",
  "Other",
] as const;

export const COMMUTE_OPTIONS = [15, 30, 45, 60, 90, 120] as const;

export const LEVEL_OPTIONS = [
  { value: 2, label: "Level 2 — Intermediate" },
  { value: 3, label: "Level 3 — Advanced" },
  { value: 4, label: "Level 4 — Higher" },
  { value: 5, label: "Level 5 — Higher" },
  { value: 6, label: "Level 6 — Degree" },
  { value: 7, label: "Level 7 — Degree" },
] as const;

export type SubjectRow = {
  subject: string;
  grade: string;
  predictedGrade: string;
};
