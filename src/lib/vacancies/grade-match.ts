import type { FaaQualification } from "./faa-client";
import { parseGradeRequirements, type ParsedRequirement } from "./grade-signal";

// Personalised version of grade-signal.ts's badge: compares a vacancy's
// already-parsed grade requirement against the student's own onboarding
// grades (subjects/grades/predicted_grades on `profiles`, A*-U scale) and
// says whether they plausibly meet it. Reuses parseGradeRequirements rather
// than re-parsing raw_json.qualifications -- same whitelist, same
// suppression rules, one source of truth.
//
// The scale mismatch is the hard part. Official source: Ofqual's own blog,
// "GCSE 9 to 1 grades: a brief guide for parents" (2 Mar 2018,
// https://ofqual.blog.gov.uk/2018/03/02/gcse-9-to-1-grades-a-brief-guide-for-parents/):
//
//   "The bottom of a grade 7 is comparable to the bottom of the old grade
//   A, the bottom of a new grade 4 is comparable to the bottom of the old
//   grade C, and the bottom of the new grade 1 is comparable to the bottom
//   of the old grade G."
//
//   "Grades A* and A are now replaced by grades 9, 8 and 7. Grades B and C
//   are replaced by grades 4, 5 and 6. Grades D, E, F and G are replaced by
//   grades 1, 2 and 3."
//
// Only THREE numeric grades (7, 4, 1) have an official single-letter floor
// equivalence -- everything else in a 3-wide band (8/9, 5/6, 2/3) genuinely
// has no citable letter equivalent, because the new scale deliberately
// spreads each old letter grade across more numeric grades at exactly the
// points DfE/Ofqual wanted finer differentiation.
//
// One further, more precise anchor from DfE's own employer-facing guidance
// (gov.uk "GCSE and A level grading" factsheet, and repeated consistently
// across gov.uk's GCSE explainer pages): "if they previously set entry
// requirements of at least a grade C, then the equivalent now would be to
// require at least grade 4" -- i.e. grade 4 IS confidently "at least old
// grade C", not merely "somewhere in the C band". That resolves grade 4
// (DfE's "standard pass") cleanly. Grade 5 ("strong pass") is NOT covered
// by that statement and has no equivalent official anchor -- a real old
// grade C might or might not have reached "strong pass" under the new
// scheme, and there's no official data to say which. So despite both
// nominally sitting in the old B/C band, grade 4 resolves confidently here
// and grade 5 (along with 6) is the genuinely ambiguous one -- shown as
// borderline rather than guessed, same suppress-or-hedge philosophy as
// grade-signal.ts and match-score.ts.

export type GradeMatchStatus = "meets" | "below" | "borderline";

// Shared badge-variant mapping so the Discovery list and the vacancy detail
// page render the same status with the same colour, rather than each
// picking its own.
export const GRADE_MATCH_BADGE_VARIANT = {
  meets: "default",
  borderline: "outline",
  below: "destructive",
} as const;

export type PersonalizedGradeMatch = {
  status: GradeMatchStatus;
  label: string;
};

export type StudentGradeProfile = {
  subjects: string[];
  grades: Record<string, string>;
  predictedGrades: Record<string, string>;
};

type LetterGrade = "A*" | "A" | "B" | "C" | "D" | "E" | "U";

// Best-to-worst order, used both for direct letter-vs-letter comparison and
// as the source of truth for LETTER_BAND below.
const LETTER_ORDER: LetterGrade[] = ["A*", "A", "B", "C", "D", "E", "U"];

// Which old-scale "band" each letter falls in, matching Ofqual's own
// A*/A -- B/C -- D/E/F/G grouping quoted above.
const LETTER_BAND: Record<LetterGrade, 0 | 1 | 2> = {
  "A*": 0,
  A: 0,
  B: 1,
  C: 1,
  D: 2,
  E: 2,
  U: 2, // placed in the lowest real band; handled as an outright miss below
};

// The one numeric grade in each band that's officially anchored to that
// band's weakest letter (7=A, 4=C, 1=G). grade-signal.ts's normalizeGrade
// never actually returns "1" in practice (its regexes only match 2-9), but
// it's included for a complete, correct algorithm.
const BAND_FLOOR_NUMERIC: Record<0 | 1 | 2, string> = { 0: "7", 1: "4", 2: "1" };

// The genuinely-ambiguous numeric grades in each band (everything in the
// band except the floor), used only to make the borderline label specific
// rather than vague.
const BAND_BORDERLINE_PAIR: Record<0 | 1 | 2, string> = { 0: "8/9", 1: "5/6", 2: "2/3" };

function numericBand(grade: string): 0 | 1 | 2 | null {
  const n = Number(grade);
  if (!Number.isInteger(n)) return null;
  if (n >= 7 && n <= 9) return 0;
  if (n >= 4 && n <= 6) return 1;
  if (n >= 1 && n <= 3) return 2;
  return null;
}

function isStudentLetterGrade(value: string): value is LetterGrade {
  return (LETTER_ORDER as string[]).includes(value);
}

// grade-signal.ts's normalizeGrade only ever produces a letter requirement
// in this exact whitelisted shape (never "E", "U", or anything else).
const REQUIRED_LETTER_GRADE = /^(A\*|[A-D])$/;

type CompareResult = { status: GradeMatchStatus; band: 0 | 1 | 2 | null };

// Compares one required grade -- as produced by grade-signal.ts's
// normalizeGrade, so either a numeric "2"-"9" or a letter "A*"/"A"/"B"/"C"/"D"
// -- against the student's own A*-U grade for the matching subject.
export function compareGrade(requiredGrade: string, studentGrade: string): CompareResult | null {
  if (!isStudentLetterGrade(studentGrade)) return null;

  // Letter requirement: same scale as the student's own grade, so this is
  // a direct, always-unambiguous comparison -- no band logic needed.
  if (REQUIRED_LETTER_GRADE.test(requiredGrade)) {
    const reqIdx = LETTER_ORDER.indexOf(requiredGrade as LetterGrade);
    const studentIdx = LETTER_ORDER.indexOf(studentGrade);
    return { status: studentIdx <= reqIdx ? "meets" : "below", band: null };
  }

  // Numeric requirement: cross-scale, band-based comparison.
  const reqBand = numericBand(requiredGrade);
  if (reqBand === null) return null;

  const studentBand = studentGrade === "U" ? 3 : LETTER_BAND[studentGrade];
  if (studentBand < reqBand) return { status: "meets", band: null };
  if (studentBand > reqBand) return { status: "below", band: null };

  // Same band: confidently met only if the requirement is that band's
  // official floor -- any letter in-band already clears a floor
  // requirement. Anything else in-band is the unresolved territory above.
  return requiredGrade === BAND_FLOOR_NUMERIC[reqBand]
    ? { status: "meets", band: null }
    : { status: "borderline", band: reqBand };
}

// Conservative, whitelist-only mapping from a student's free-text GCSE
// subject name to the categories grade-signal.ts recognises on the vacancy
// side. Anything not clearly one of these is left unmatched rather than
// guessed -- e.g. "English Literature" is deliberately NOT treated as
// "English", since a vacancy's "English" requirement almost always means
// English Language, and conflating the two would misrepresent a real
// requirement.
function canonicalStudentSubject(raw: string): "English" | "Maths" | "Science" | null {
  const s = raw.trim().toLowerCase();
  if (s === "maths" || s === "mathematics" || s === "math") return "Maths";
  if (s === "english" || s === "english language") return "English";
  if (
    s === "science" ||
    s === "combined science" ||
    s === "core science" ||
    s === "double science" ||
    s === "additional science"
  )
    return "Science";
  return null;
}

// Prefers the actual (sat) grade over the predicted one when both exist --
// onboarding stores them as two independent maps, so either can be present
// alone.
function findStudentGrade(
  subject: "English" | "Maths" | "Science",
  student: StudentGradeProfile
): string | null {
  for (const raw of student.subjects) {
    if (canonicalStudentSubject(raw) !== subject) continue;
    const actual = student.grades[raw];
    if (actual) return actual;
    const predicted = student.predictedGrades[raw];
    if (predicted) return predicted;
  }
  return null;
}

const STATUS_SEVERITY: Record<GradeMatchStatus, number> = { meets: 0, borderline: 1, below: 2 };

const STATUS_LABEL: Record<GradeMatchStatus, string> = {
  meets: "You meet this",
  below: "Below this — check the exact requirement",
  borderline: "Borderline — check the exact requirement",
};

function subjectsForRequirement(
  subject: ParsedRequirement["subject"]
): Array<"English" | "Maths" | "Science"> {
  return subject === "Maths & English" ? ["Maths", "English"] : [subject];
}

// Returns null whenever there isn't enough clean data to say anything --
// no parseable Essential requirement (same suppression as
// parseGradeEligibilitySignal), or the student is missing a grade for a
// subject the requirement needs. A missing subject is suppressed entirely
// rather than partially shown, same "a partial signal that silently drops
// something is worse than no signal" rule grade-signal.ts already applies.
export function personalizeGradeSignal(
  qualifications: FaaQualification[] | null | undefined,
  student: StudentGradeProfile
): PersonalizedGradeMatch | null {
  const requirements = parseGradeRequirements(qualifications);
  if (!requirements) return null;

  let worst: GradeMatchStatus = "meets";
  const borderlineBands = new Set<0 | 1 | 2>();

  for (const req of requirements) {
    for (const subject of subjectsForRequirement(req.subject)) {
      const studentGrade = findStudentGrade(subject, student);
      if (!studentGrade) return null;

      const result = compareGrade(req.grade, studentGrade);
      if (!result) return null;

      if (STATUS_SEVERITY[result.status] > STATUS_SEVERITY[worst]) worst = result.status;
      if (result.status === "borderline" && result.band !== null) borderlineBands.add(result.band);
    }
  }

  let label = STATUS_LABEL[worst];
  if (worst === "borderline") {
    label =
      borderlineBands.size === 1
        ? `Borderline — grade ${BAND_BORDERLINE_PAIR[[...borderlineBands][0]]} boundary, check directly`
        : "Borderline — right at a grade boundary, check directly";
  }

  return { status: worst, label };
}
