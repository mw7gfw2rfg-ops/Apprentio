import type { InterviewPrepFormat } from "./constants";

export type PrepSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  link?: { label: string; href: string };
};

// Verified live (2026-08): no employer in Apprentio's data (employer_sources
// notes, the AI employer_research cache, or vacancies.raw_json) documents
// which assessment provider it actually uses -- so this is deliberately
// generic practice, not tailored to any specific employer's real test. Also
// verified live: this specific AssessmentDay page is genuinely free with no
// signup wall (unlike AssessmentDay's own homepage funnel, and unlike
// Graduates First's "FREE tests" nav item, which actually leads to a full
// account registration form).
const FREE_PRACTICE_LINK = {
  label: "Practice sample aptitude test questions on AssessmentDay",
  href: "https://www.assessmentday.co.uk/resources/aptitude-test-sample-questions-answers.html",
};

// Shown under Video interview and Panel interview -- the structuring
// technique applies to any competency-based question, regardless of format.
export const STAR_SECTION: PrepSection = {
  heading: "Structuring answers: STAR",
  paragraphs: [
    "Most competency questions (\"Tell me about a time you...\") are easier to answer well with a simple structure, so you cover what the interviewer is actually listening for instead of rambling into the story.",
  ],
  bullets: [
    "Situation — briefly set the scene: where, when, what was going on.",
    "Task — what were you specifically responsible for or trying to achieve?",
    "Action — what did YOU do, specifically? This is the part to spend the most time on.",
    "Result — what happened? Use a number or concrete outcome if you can, and what you'd do differently is a good bonus line.",
  ],
};

const ONLINE_TESTS: PrepSection[] = [
  {
    heading: "Numerical & verbal reasoning tests",
    paragraphs: [
      "These are the timed, right-answer tests you'll see described as \"SHL-style\" — SHL is the best-known provider of this category, though several others (Cubiks, Talogy, Kenexa) work the same way. There is a correct answer, and you're scored against it and against a time limit, usually 60-90 seconds per question.",
      "Numerical reasoning gives you a table, graph, or chart and asks you to work out a value, percentage, or trend from it — it's testing whether you can read data accurately under time pressure, not advanced maths.",
      "Verbal reasoning gives you a short passage and asks whether a statement is True, False, or Cannot Say based only on what the passage actually states — the trap is answering from general knowledge or a reasonable assumption instead of what's literally written.",
    ],
    bullets: [
      "Practice under real time pressure, not untimed — the clock is most of the difficulty.",
      "Skim the passage/table first to know what's there, then read the question.",
      "If you're stuck, guess and move on — most of these tests penalise you more for running out of time than for one wrong answer.",
    ],
  },
  {
    heading: "Situational judgement tests (SJTs)",
    paragraphs: [
      "You'll be shown a workplace scenario and a set of possible responses. There are two genuinely different kinds, and it matters which one you're taking:",
      "Traditional SJTs (the SHL-style ones) score your answers against a \"correct\" or \"best\" response, usually built around the employer's stated competency framework — these behave like the reasoning tests above: there is a right answer to find.",
      "Strengths-based SJTs (best known through Cappfinity, used by a number of large graduate/apprentice employers) explicitly have no right answer. They're measuring genuine energy and preference — do you actually enjoy this kind of task, not just \"can you spot the correct customer-service line.\" Answering strategically, or picking what you think sounds best, tends to score worse than answering honestly and instinctively, because inconsistent or effortfully-'correct' answers are what the scoring is actually designed to catch.",
    ],
    bullets: [
      "If it feels like it's asking how you'd feel about something, not just what you'd do — it's probably strengths-based. Be genuine.",
      "If it's clearly testing \"what's the right way to handle this customer/colleague\" — it's probably traditional. Think about what the employer's values/competencies (from the job description) would favour.",
    ],
  },
  {
    heading: "Free general practice",
    paragraphs: [
      "Apprentio doesn't have documented information on which test provider this specific employer actually uses, so this isn't tailored to their real test — it's general practice with the numerical, verbal and logical reasoning question formats above.",
    ],
    link: FREE_PRACTICE_LINK,
  },
];

const VIDEO_INTERVIEW: PrepSection[] = [
  {
    heading: "How a one-way video interview actually works",
    paragraphs: [
      "There's no live interviewer — you're on a platform (HireVue and Sonru are the most common) that shows you a question, gives you a fixed prep window (commonly 20-60 seconds) to think, then starts recording for a fixed answer window (commonly 1-3 minutes), often with only one attempt or a very limited number of retakes.",
      "Because there's no one to react to you, it can feel strange — that's normal. Treat the camera lens as the interviewer's eyes: look at it, not at your own preview image.",
    ],
    bullets: [
      "Use the prep window to jot a one-line STAR skeleton, not a full script — you won't have time to read it back anyway.",
      "Sit somewhere quiet, well-lit from in front of you (not behind), with a plain background.",
      "If a retake is offered, use it — first takes are usually the most nervous ones. If it isn't, a slightly imperfect honest answer beats a frozen, over-rehearsed one.",
    ],
  },
];

const ASSESSMENT_CENTRE: PrepSection[] = [
  {
    heading: "What an assessment centre day usually involves",
    paragraphs: [
      "A mix of exercises across a half-day or full day, usually alongside other candidates, assessed by trained assessors against the employer's competency framework rather than by a single interviewer's impression.",
    ],
  },
  {
    heading: "Group exercise",
    paragraphs: [
      "A small group works through a task or discussion together — often with no clear leader appointed. Assessors are watching how you contribute, not just whether your team \"wins.\"",
    ],
    bullets: [
      "Bring other people in (\"What do you think, [name]?\") — this is scored as positively as making your own points.",
      "Build on others' ideas by name rather than just waiting for your turn to talk.",
      "Don't dominate or go silent — both read badly. Aim to be the person people remember as easy to work with.",
    ],
  },
  {
    heading: "Case study",
    paragraphs: [
      "You're given a business scenario (often with data) and asked to analyse it and present findings or a recommendation, individually or in a small group.",
    ],
    bullets: [
      "State your recommendation early, then walk through the reasoning — don't save the conclusion for the end.",
      "It's fine to make reasonable assumptions if information is missing, as long as you say out loud that you're assuming it.",
    ],
  },
  {
    heading: "In-tray / e-tray exercise",
    paragraphs: [
      "A simulated inbox of emails, memos, and requests that you have to triage and respond to under a time limit — testing prioritisation and judgement under pressure, not any specific technical skill.",
    ],
    bullets: [
      "Skim everything first before acting on anything — an early item can be less urgent than a later one.",
      "Be decisive: a reasonable decision made and briefly justified beats leaving items unanswered.",
    ],
  },
  {
    heading: "Presentation",
    paragraphs: [
      "You'll usually be given a topic (sometimes on the day, sometimes in advance) and a short slot to present, often followed by questions from the assessors.",
    ],
    bullets: [
      "Structure beats content: a clear beginning/middle/end with a strong final point outperforms cramming in more facts.",
      "Prepare for 2-3 likely follow-up questions on your topic — being asked something is normal, not a sign it went badly.",
    ],
  },
  {
    heading: "Free general practice",
    paragraphs: [
      "Some assessment centres include a numerical/verbal/logical reasoning test as one of the exercises. Apprentio doesn't have documented information on which test provider this specific employer actually uses, so this isn't tailored to their real test — it's general practice with the format.",
    ],
    link: FREE_PRACTICE_LINK,
  },
];

const PANEL_INTERVIEW: PrepSection[] = [
  {
    heading: "What a panel interview involves",
    paragraphs: [
      "Two or more interviewers (often a mix of HR and a hiring manager, sometimes a technical assessor too), usually asking a blend of competency questions (\"Tell me about a time...\"), motivational questions (\"Why this employer / this apprenticeship?\"), and sometimes light technical or scenario questions.",
      "Different panel members often ask different question types — it's normal, and it's fine to direct your answer mainly to whoever asked, with a glance to the others.",
    ],
  },
];

export const PREP_CONTENT: Record<InterviewPrepFormat, PrepSection[]> = {
  online_tests: ONLINE_TESTS,
  video_interview: [...VIDEO_INTERVIEW, STAR_SECTION],
  assessment_centre: ASSESSMENT_CENTRE,
  panel_interview: [...PANEL_INTERVIEW, STAR_SECTION],
};

export const VETTING_SECTION: PrepSection = {
  heading: "Security vetting (DV/CTC) — what to actually expect",
  paragraphs: [
    "Government and national security employers run formal security vetting as a separate stage that happens after the assessment centre / interview stage, not instead of it or before it — passing the interview process doesn't mean you're in yet, and it doesn't mean vetting is a formality either.",
    "It genuinely takes a long time. Higher levels (Developed Vetting, \"DV\") commonly take several months from questionnaire submission to clearance, sometimes longer if there's more to check (time abroad, family circumstances, financial history).",
    "Silence during this period is completely normal, not a rejection signal. There is usually no progress update you'll receive — you not hearing anything for weeks is what the process looks like when it's working normally, not a bad sign.",
    "Honesty on the vetting questionnaire matters far more than having a spotless record. Vetting is built around risk of concealment, not around never having had a problem — a disclosed issue (a caution, a debt, past drug use, a family circumstance) is usually assessable and often fine; an undisclosed one that surfaces later is the actual disqualifier.",
  ],
};
