import Anthropic from "@anthropic-ai/sdk";
import type { EmployerResearch } from "@/lib/drafting/employer-research";

type VacancyContext = {
  employer_name: string;
  role_title: string;
  description: string | null;
  apprenticeship_level: number | null;
  standard_reference: string | null;
  location: string | null;
};

export type GeneratedInterviewPrep = {
  questions: { question: string; why_asked: string }[];
  talking_points: string[];
};

const FORMAT_FRAMING: Record<"video_interview" | "panel_interview", string> = {
  video_interview:
    "This is for a ONE-WAY VIDEO INTERVIEW: the student records answers alone to pre-set questions with no live interviewer and a fixed time limit (commonly 1-3 minutes). Phrase questions the way they'd actually appear on a video interview platform (HireVue-style), and keep them answerable in that time.",
  panel_interview:
    "This is for a PANEL INTERVIEW: multiple interviewers asking a mix of competency and motivational questions live. Include a mix of competency (\"Tell me about a time...\") and motivational (\"Why this role/employer\") questions, the kind a panel would realistically ask.",
};

export async function generateInterviewQuestions({
  format,
  vacancy,
  employerResearch,
  employerSourceNotes,
}: {
  format: "video_interview" | "panel_interview";
  vacancy: VacancyContext;
  employerResearch: EmployerResearch | null;
  employerSourceNotes: string | null;
}): Promise<GeneratedInterviewPrep> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const researchSection =
    employerResearch?.found
      ? `EMPLOYER RESEARCH (genuine, web-sourced)
Summary: ${employerResearch.summary || "(none found)"}
Values / culture: ${employerResearch.values_culture || "(none found)"}
Notable facts: ${employerResearch.notable_facts || "(none found)"}`
      : "EMPLOYER RESEARCH\nNo genuine research is available for this employer.";

  const sourceNotesSection = employerSourceNotes
    ? `EMPLOYER SOURCE NOTES (internally verified facts about this employer, e.g. application process details)\n${employerSourceNotes}`
    : "EMPLOYER SOURCE NOTES\nNone available.";

  const prompt = `You are helping a UK sixth-form student prepare for a degree apprenticeship ${format === "video_interview" ? "video interview" : "panel interview"} at a specific employer.

${FORMAT_FRAMING[format]}

Generate 5-6 realistic interview questions for this specific vacancy, each with a one-line note on what the interviewer is actually assessing with that question. Then generate 3-4 short talking points the student could use to connect their own background to this specific role -- things worth mentioning, not full scripted answers.

Rules:
- Ground every question and talking point in the VACANCY and EMPLOYER RESEARCH/SOURCE NOTES below. Do not invent employer facts, culture claims, or achievements that aren't in that material.
- Do not claim this employer uses a specific test provider, assessment platform, or interview process (e.g. "SHL", "HireVue", "an assessment centre with X exercise") unless EMPLOYER SOURCE NOTES explicitly documents it. If nothing documents their process, keep questions generic to the role and sector instead of guessing their process.
- Talking points must reference only genuinely plausible sixth-form-level experience (A-levels, school projects, personal projects, part-time work, extracurriculars) in general terms -- you don't have this specific student's CV, so keep points about what KIND of experience would be worth raising, not invented specifics.

VACANCY
Employer: ${vacancy.employer_name}
Role: ${vacancy.role_title}
Apprenticeship level: ${vacancy.apprenticeship_level ?? "unknown"}
Standard reference: ${vacancy.standard_reference ?? "unknown"}
Location: ${vacancy.location ?? "unknown"}
Description:
${vacancy.description ?? "(no description provided)"}

${researchSection}

${sourceNotesSection}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    tools: [
      {
        name: "submit_interview_prep",
        description: "Submit the generated interview questions and talking points",
        input_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  why_asked: {
                    type: "string",
                    description: "One line on what the interviewer is assessing",
                  },
                },
                required: ["question", "why_asked"],
              },
            },
            talking_points: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["questions", "talking_points"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "submit_interview_prep" },
    messages: [{ role: "user", content: prompt }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return structured interview prep");
  }

  return toolUse.input as GeneratedInterviewPrep;
}
