import Anthropic from "@anthropic-ai/sdk";
import { extractText } from "@/lib/documents/extract-text";
import type { createClient } from "@/lib/supabase/server";
import { getOrResearchEmployer } from "@/lib/drafting/employer-research";

const BUCKET = "base-documents";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type VacancyContext = {
  employer_name: string;
  role_title: string;
  description: string | null;
  apprenticeship_level: number | null;
  standard_reference: string | null;
  location: string | null;
};

async function downloadAndExtract(supabase: SupabaseClient, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) {
    throw new Error(`Could not download ${path}: ${error?.message ?? "not found"}`);
  }
  const bytes = await data.arrayBuffer();
  return extractText(bytes, path);
}

export async function generateDraft({
  supabase,
  baseCvPath,
  baseCoverLetterPath,
  vacancy,
}: {
  supabase: SupabaseClient;
  baseCvPath: string;
  baseCoverLetterPath: string;
  vacancy: VacancyContext;
}): Promise<{ tailoredCv: string; tailoredCoverLetter: string }> {
  const [baseCv, baseCoverLetter, research] = await Promise.all([
    downloadAndExtract(supabase, baseCvPath),
    downloadAndExtract(supabase, baseCoverLetterPath),
    getOrResearchEmployer(vacancy.employer_name, supabase),
  ]);

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const researchSection = research.found
    ? `EMPLOYER RESEARCH (genuine, web-sourced -- you may draw on this for the cover letter)
Summary: ${research.summary || "(none found)"}
Values / culture: ${research.values_culture || "(none found)"}
Notable facts: ${research.notable_facts || "(none found)"}
Source: ${research.source || "(none)"}`
    : `EMPLOYER RESEARCH
No genuine information about this employer could be found via web search. Do not state anything specific about the company beyond what's in the vacancy description below.`;

  const prompt = `You are helping a UK sixth-form student tailor their CV and cover letter for a specific degree apprenticeship vacancy.

Rules:
- Only use information already present in their base CV and base cover letter below. Do not invent experience, qualifications, grades, or achievements.
- You may re-order, re-emphasise, and rephrase existing content to better fit the vacancy.
- The cover letter should reference something genuine about the employer -- drawn only from the EMPLOYER RESEARCH or VACANCY sections below -- instead of generic filler like "I admire your commitment to excellence". Do not state anything as fact about the company that isn't grounded in that research or the vacancy listing itself. If the research found nothing, don't invent a substitute -- just don't make employer-specific claims.
- Keep the tone appropriate for a sixth-form student applying to a degree apprenticeship.

VACANCY
Employer: ${vacancy.employer_name}
Role: ${vacancy.role_title}
Apprenticeship level: ${vacancy.apprenticeship_level ?? "unknown"}
Standard reference: ${vacancy.standard_reference ?? "unknown"}
Location: ${vacancy.location ?? "unknown"}
Description:
${vacancy.description ?? "(no description provided)"}

${researchSection}

BASE CV
${baseCv}

BASE COVER LETTER
${baseCoverLetter}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    tools: [
      {
        name: "submit_draft",
        description: "Submit the tailored CV and cover letter for this vacancy",
        input_schema: {
          type: "object",
          properties: {
            tailored_cv: { type: "string", description: "The full tailored CV, plain text" },
            tailored_cover_letter: {
              type: "string",
              description: "The full tailored cover letter, plain text",
            },
          },
          required: ["tailored_cv", "tailored_cover_letter"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "submit_draft" },
    messages: [{ role: "user", content: prompt }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a structured draft");
  }

  const input = toolUse.input as { tailored_cv: string; tailored_cover_letter: string };
  return { tailoredCv: input.tailored_cv, tailoredCoverLetter: input.tailored_cover_letter };
}
