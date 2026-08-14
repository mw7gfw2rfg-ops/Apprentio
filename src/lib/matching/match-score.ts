import { stripHtml } from "@/lib/vacancies/format";
import type { FaaVacancy } from "@/lib/vacancies/faa-client";

// Plain keyword/requirement-overlap scoring between a student's base CV and
// a vacancy's description/skills -- no embeddings, no LLM calls, so this
// runs safely on every vacancy a free-tier user sees without touching the
// Anthropic cost gates (OVERNIGHT_SECURITY_REVIEW.md #1/#2). It's a rough
// heuristic, not a precise match -- the goal is a genuine, visibly-varying
// signal that nudges toward an AI-tailored draft, not exact scoring.

const STOPWORDS = new Set([
  "a","about","above","after","again","against","all","am","an","and","any","are","aren't","as","at",
  "be","because","been","before","being","below","between","both","but","by",
  "can","cannot","could","couldn't",
  "did","didn't","do","does","doesn't","doing","don't","down","during",
  "each","few","for","from","further",
  "had","hadn't","has","hasn't","have","haven't","having","he","he'd","he'll","he's","her","here","here's","hers","herself","him","himself","his","how","how's",
  "i","i'd","i'll","i'm","i've","if","in","into","is","isn't","it","it's","its","itself",
  "let's",
  "me","more","most","mustn't","my","myself",
  "no","nor","not","of","off","on","once","only","or","other","ought","our","ours","ourselves","out","over","own",
  "same","shan't","she","she'd","she'll","she's","should","shouldn't","so","some","such",
  "than","that","that's","the","their","theirs","them","themselves","then","there","there's","these","they","they'd","they'll","they're","they've","this","those","through","to","too",
  "under","until","up",
  "very",
  "was","wasn't","we","we'd","we'll","we're","we've","were","weren't","what","what's","when","when's","where","where's","which","while","who","who's","whom","why","why's","with","won't","would","wouldn't",
  "you","you'd","you'll","you're","you've","your","yours","yourself","yourselves",
]);

// Boilerplate that appears in almost every apprenticeship listing and
// almost every CV -- left in, it would inflate overlap without being a
// genuine signal of fit for this specific role.
const DOMAIN_NOISE = new Set([
  "apprentice","apprenticeship","apprenticeships","role","roles","job","jobs","position","positions",
  "candidate","candidates","applicant","applicants","employer","employers","company","companies",
  "vacancy","vacancies","successful","working","work","working","day","days","week","weeks","year","years",
  "training","provider","description","include","includes","including","also","will","must","should",
  "please","apply","application","opportunity","opportunities","ideal","looking","required","requirements",
  "based","across","within","towards","level","standard",
]);

// Suffixes stripped off skills-array labels ("Communication skills" ->
// "communication") so a CV that says "strong communicator" or "communication"
// without the trailing word still counts as a substring hit against a
// commonly-used CV phrase.
const SKILL_SUFFIX = /\s+skills?$/i;

// Literal placeholder values seen in real data (raw_json.skills), not real
// skill requirements -- see grade-signal.ts for the equivalent "None
// required" pattern on the qualifications field.
const SKILL_JUNK = new Set(["no skills required", "none", "n/a"]);

// Present in 40-75% of ALL sampled vacancies regardless of sector (research
// sample, logged in TODO.md) -- near-universal soft-skill boilerplate that
// both a listing and a typical CV are almost guaranteed to mention no
// matter the role, so matching on these adds close to zero differentiation
// between genuinely different vacancies. Validated against real listings +
// synthetic CVs before shipping: leaving these in made an engineering CV
// score *higher* against childcare listings than some engineering ones,
// because both sides share this boilerplate regardless of domain.
// Excluded so the score reflects real overlap, not shared filler.
const GENERIC_SKILLS = new Set([
  "communication", "team working", "teamworking", "organisation", "organisational",
  "attention to detail", "patience", "problem solving", "initiative",
  "customer care", "non judgemental", "logical",
]);

function normalizeSkillLabel(raw: string): string | null {
  const cleaned = raw.trim().toLowerCase().replace(SKILL_SUFFIX, "").trim();
  if (!cleaned || SKILL_JUNK.has(cleaned) || GENERIC_SKILLS.has(cleaned)) return null;
  // A handful of raw_json.skills entries are actually grade requirements
  // mis-tagged as skills (e.g. "Grade 4 & above - GSCE English") -- these
  // aren't keyword-matchable against a CV in any meaningful way.
  if (/grade|gcse/i.test(cleaned)) return null;
  return cleaned;
}

function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? [];
  return matches.filter((w) => !STOPWORDS.has(w) && !DOMAIN_NOISE.has(w));
}

// Frequency-ranked, deduped unigrams from free text, capped so a long
// description doesn't drown the skill-array signal with low-value tail
// words.
function extractTextKeywords(text: string, cap = 20): string[] {
  const freq = new Map<string, number>();
  for (const word of tokenize(text)) {
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, cap)
    .map(([word]) => word);
}

export type VacancyKeywords = {
  skillPhrases: string[];
  textKeywords: string[];
};

export function extractVacancyKeywords(vacancy: {
  source: "gov_api" | "curated";
  rawJson: unknown;
  description: string | null;
}): VacancyKeywords {
  const faa = vacancy.source === "gov_api" ? (vacancy.rawJson as FaaVacancy | null) : null;

  const skillPhrases = [
    ...new Set((faa?.skills ?? []).map(normalizeSkillLabel).filter((s): s is string => s !== null)),
  ];

  const descriptionText = faa
    ? stripHtml(faa.fullDescription) || stripHtml(faa.description)
    : vacancy.description || "";
  const textKeywords = extractTextKeywords(descriptionText);

  return { skillPhrases, textKeywords };
}

export type PreparedCv = {
  textLower: string;
  wordSet: Set<string>;
};

export function prepareCvForMatching(cvText: string): PreparedCv {
  return {
    textLower: cvText.toLowerCase(),
    wordSet: new Set(tokenize(cvText)),
  };
}

export type MatchResult = {
  percent: number;
  label: string;
  matchedKeywords: string[];
};

// Skill-array matches are curated, high-confidence signal; free-text
// The remaining skill-array entries (after GENERIC_SKILLS is filtered out)
// are still a curated, higher-confidence signal than free-text keywords --
// weighted higher, but not by as much as the generic-boilerplate skills
// would have justified, since free-text domain words (the role's actual
// subject matter) are what genuinely differentiate one vacancy from
// another.
const SKILL_WEIGHT = 2;
const TEXT_WEIGHT = 1;

// Below this much combined vacancy-side signal, a percentage would be
// noise dressed up as precision (e.g. "100% match" from matching 1 of 1
// keyword) -- show nothing rather than a misleading score, same principle
// as grade-signal.ts's suppression rule.
const MIN_SIGNAL_WEIGHT = 4;

function labelFor(percent: number): string {
  if (percent >= 50) return "Strong match";
  if (percent >= 25) return "Good match";
  if (percent >= 10) return "Some overlap";
  return "Limited overlap";
}

export function scoreMatch(cv: PreparedCv, vacancy: VacancyKeywords): MatchResult | null {
  const matchedSkills = vacancy.skillPhrases.filter((phrase) => cv.textLower.includes(phrase));
  const matchedText = vacancy.textKeywords.filter((word) => cv.wordSet.has(word));

  const totalWeight =
    vacancy.skillPhrases.length * SKILL_WEIGHT + vacancy.textKeywords.length * TEXT_WEIGHT;
  if (totalWeight < MIN_SIGNAL_WEIGHT) return null;

  const matchedWeight = matchedSkills.length * SKILL_WEIGHT + matchedText.length * TEXT_WEIGHT;
  const percent = Math.max(0, Math.min(100, Math.round((matchedWeight / totalWeight) * 100)));

  const matchedKeywords = [
    ...matchedSkills.map((s) => s.replace(/\b\w/g, (c) => c.toUpperCase())),
    ...matchedText,
  ].slice(0, 5);

  return { percent, label: labelFor(percent), matchedKeywords };
}
