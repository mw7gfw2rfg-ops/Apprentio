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

export type SubjectRow = {
  subject: string;
  grade: string;
  predictedGrade: string;
};
