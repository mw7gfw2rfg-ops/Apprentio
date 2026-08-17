import type { FaaQualification } from "./faa-client";

// Soft, display-only signal built from raw_json.qualifications on gov_api
// listings. This only summarises what the vacancy itself asks for -- it is
// NOT a personalised match against the student's own grades. That
// comparison (translating between onboarding's A*-U scale and the 9-1
// numeric scale used here) is built separately in ./grade-match.ts, reusing
// parseGradeRequirements below rather than re-parsing the raw data.
//
// Deliberately conservative: research against 2,100+ real gov_api rows
// (see TODO.md) found `qualifications` reliably structured
// ({qualificationType, subject, grade, weighting}), but the `grade` string
// specifically has a long tail of inconsistent formatting (mixed
// separators, dashes, "or equivalent" qualifiers, vocational "Pass"
// grading). Only entries matching a whitelisted, confidently-parseable
// pattern are used. If ANY Essential entry on a vacancy fails to parse,
// the whole badge is suppressed for that vacancy -- a partial badge that
// silently drops an unparsed requirement would misrepresent completeness,
// which is worse than showing nothing.

export type ParsedRequirement = {
  subject: "English" | "Maths" | "Maths & English" | "Science";
  grade: string;
};

function cleanSubject(raw: string): string {
  return raw
    .trim()
    .replace(/\s*g\.?c\.?s\.?e\.?\s*$/i, "")
    .replace(/\s*or equivalent$/i, "")
    .trim();
}

function normalizeSubject(raw: string): ParsedRequirement["subject"] | null {
  const s = cleanSubject(raw);
  if (/^(maths?|mathematics|math)\s*(&|and|\/)\s*english$/i.test(s)) return "Maths & English";
  if (/^english\s*(&|and|\/)\s*(maths?|mathematics|math)$/i.test(s)) return "Maths & English";
  if (/^english(\s*language)?$/i.test(s)) return "English";
  if (/^(maths?|mathematics|math)$/i.test(s)) return "Maths";
  if (/^science$/i.test(s)) return "Science";
  return null;
}

function cleanGrade(raw: string): string {
  let out = raw.trim();
  // normalise en/em-dash and minus sign to a plain hyphen
  out = out.replace(/[‒–—−]/g, "-");
  out = out.replace(/\s+/g, " ").trim();

  // strip leading qualifiers -- loop since e.g. "Minimum Grade C" has two
  let prev: string;
  do {
    prev = out;
    out = out.replace(/^(grades?|at\s*grade|minimum|min\.?)\s*/i, "");
  } while (out !== prev);

  // strip trailing qualifiers, bare or parenthesised -- "4 or above" and
  // "4 (or above)" are the same certainty of signal, just different
  // punctuation
  do {
    prev = out;
    out = out
      .replace(/\s*\(\s*(or\s*above|and\s*above|or\s*equivalent)\s*\)\s*$/i, "")
      .replace(/\s*(or\s*above|and\s*above|or\s*equivalent)\s*$/i, "")
      .trim();
  } while (out !== prev);

  // drop a redundant parenthetical old-grade annotation, e.g. "(A*-C)"
  out = out.replace(/\(\s*A\*?\s*-\s*[A-D]\s*\)/i, "").trim();
  out = out.replace(/\s+/g, " ").trim();

  // tighten spacing around separators for consistent matching
  out = out.replace(/\s*\/\s*/g, "/").replace(/\s*-\s*/g, "-");
  return out;
}

// Returns a canonical minimum-grade label (prefers the numeric 9-1 form
// when both a numeric and letter form are given), or null if the string
// isn't a confidently-recognised pattern.
function normalizeGrade(raw: string): string | null {
  const g = cleanGrade(raw);

  // combined old+new range, e.g. "A*-C/9-4" or "9-4/A*-C"
  let m = g.match(/^A\*?-[A-D]\/(?:9-([2-9])|([2-9])-9)$/i);
  if (m) return m[1] ?? m[2];
  m = g.match(/^(?:9-([2-9])|([2-9])-9)\/A\*?-[A-D]$/i);
  if (m) return m[1] ?? m[2];

  // plain numeric range, minimum bound
  m = g.match(/^([2-9])-9$/);
  if (m) return m[1];
  m = g.match(/^9-([2-9])$/);
  if (m) return m[1];

  // dual notation single value: "4/C", "C/4", "4-C", "C-4" (+ optional "+")
  m = g.match(/^([2-9])[/-]([A-D])\+?$/i);
  if (m) return m[1];
  m = g.match(/^([A-D])[/-]([2-9])\+?$/i);
  if (m) return m[2];

  // parenthesised dual notation: "4(C)", "C(4)"
  m = g.match(/^([2-9])\(([A-D])\)$/i);
  if (m) return m[1];
  m = g.match(/^([A-D])\(([2-9])\)$/i);
  if (m) return m[2];

  // "4 or C" / "C or 4"
  m = g.match(/^([2-9])\s*or\s*([A-D])$/i);
  if (m) return m[1];
  m = g.match(/^([A-D])\s*or\s*([2-9])$/i);
  if (m) return m[2];

  // plain single digit
  m = g.match(/^([2-9])$/);
  if (m) return m[1];

  // plain single letter (allow A*)
  m = g.match(/^(A\*|[A-D])$/i);
  if (m) return m[1].toUpperCase();

  // letter range, e.g. "A-D" -> weakest acceptable bound
  if (/^A\*?-D$/i.test(g)) return "D";

  // "Pass"/"Merit"/etc (vocational grading, not comparable) and anything
  // else not matching a whitelisted pattern above
  return null;
}

// Canonical subject ordering for combining multiple grade-matched entries
// into one clause, e.g. "Maths & English" not "English & Maths".
const SUBJECT_ORDER: Record<ParsedRequirement["subject"], number> = {
  Maths: 0,
  English: 1,
  "Maths & English": 0,
  Science: 2,
};

// Structured form of the same whitelist parse used by
// parseGradeEligibilitySignal below -- exported so other modules (the
// personalised grade-match comparison in grade-match.ts) can reuse the
// exact same conservative parsing instead of re-implementing it. Same
// suppression rule applies: returns null if there's nothing to parse, or
// if ANY Essential entry fails to parse confidently.
export function parseGradeRequirements(
  qualifications: FaaQualification[] | null | undefined
): ParsedRequirement[] | null {
  if (!qualifications || qualifications.length === 0) return null;

  const essential = qualifications.filter((q) => q.weighting === "Essential");
  if (essential.length === 0) return null;

  const parsed: ParsedRequirement[] = [];
  for (const q of essential) {
    if (!q.subject || !q.grade) return null;
    const subject = normalizeSubject(q.subject);
    const grade = normalizeGrade(q.grade);
    if (!subject || !grade) return null;
    parsed.push({ subject, grade });
  }
  return parsed;
}

export function parseGradeEligibilitySignal(
  qualifications: FaaQualification[] | null | undefined
): string | null {
  const parsed = parseGradeRequirements(qualifications);
  if (!parsed) return null;

  // group by grade, join subjects sharing that grade
  const byGrade = new Map<string, Set<ParsedRequirement["subject"]>>();
  for (const { subject, grade } of parsed) {
    if (!byGrade.has(grade)) byGrade.set(grade, new Set());
    byGrade.get(grade)!.add(subject);
  }

  const clauses = [...byGrade.entries()].map(([grade, subjects]) => {
    const subjectLabel = [...subjects]
      .sort((a, b) => SUBJECT_ORDER[a] - SUBJECT_ORDER[b])
      .join(" & ");
    return `Grade ${grade}+ in ${subjectLabel}`;
  });

  return `May need ${clauses.join(", ")}`;
}
