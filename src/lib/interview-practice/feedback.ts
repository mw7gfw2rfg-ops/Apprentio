import Anthropic from "@anthropic-ai/sdk";
import type { SpeechStats } from "./speech-stats";

export type InterviewPracticeFeedback = {
  content_feedback: string;
  star_feedback: string;
  pacing_feedback: string;
  filler_word_feedback: string;
  overall_summary: string;
};

// The transcript is the student's own recorded speech, not third-party
// content -- same category as their uploaded base CV/cover letter
// (prompt-safety.ts), so it's deliberately not wrapped as untrusted_data.
export async function generateInterviewPracticeFeedback({
  question,
  whyAsked,
  transcript,
  stats,
}: {
  question: string;
  whyAsked: string | null;
  transcript: string;
  stats: SpeechStats;
}): Promise<InterviewPracticeFeedback> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const fillerSummary =
    stats.fillerWordCount > 0
      ? Object.entries(stats.fillerWordBreakdown)
          .map(([word, count]) => `"${word}" x${count}`)
          .join(", ")
      : "none detected";

  const prompt = `You are giving a UK sixth-form student direct, constructive feedback on a spoken practice answer to a degree-apprenticeship interview question. The answer was recorded, transcribed, and the timing/filler-word numbers below were computed programmatically from the real audio -- they are accurate, not estimates, so treat them as ground truth.

QUESTION ASKED
${question}
${whyAsked ? `(What this question is assessing: ${whyAsked})` : ""}

TRANSCRIPT OF THE STUDENT'S SPOKEN ANSWER
${transcript}

MEASURED SPEECH STATS (computed from real audio timing, not estimated)
- Duration: ${stats.durationSeconds.toFixed(1)}s
- Word count: ${stats.wordCount}
- Pace: ${stats.wordsPerMinute} words/minute (${stats.pace})
- Longest pause between words: ${stats.longestPauseSeconds}s
- Filler words detected: ${fillerSummary}

Give feedback in four parts:
1. Content: does the answer actually address what the question is asking? Is it specific and concrete, or vague/generic?
2. STAR structure: for a competency-style question, does the answer follow Situation/Task/Action/Result (or, if it's not that kind of question, say so and skip the STAR-specific critique)? Name what's present and what's missing.
3. Pacing: comment on the pace and the longest-pause figure above -- e.g. rambling, rushed, well-paced, a long hesitation before answering.
4. Filler words: comment on the filler-word frequency above relative to the answer's length -- a couple of "so"s in a 200-word answer is normal, frequent "um"/"like" every few words is worth flagging.

Be specific and reference actual words/phrases from the transcript where useful. Be encouraging but honest -- this is practice feedback meant to genuinely improve the next attempt, not empty praise.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1536,
    tools: [
      {
        name: "submit_practice_feedback",
        description: "Submit structured feedback on the practice answer",
        input_schema: {
          type: "object",
          properties: {
            content_feedback: { type: "string", description: "Feedback on how well the answer addresses the question" },
            star_feedback: { type: "string", description: "Feedback on STAR structure coverage, or a note that STAR doesn't apply" },
            pacing_feedback: { type: "string", description: "Feedback on pace and pausing" },
            filler_word_feedback: { type: "string", description: "Feedback on filler-word frequency" },
            overall_summary: { type: "string", description: "One or two sentence overall takeaway" },
          },
          required: ["content_feedback", "star_feedback", "pacing_feedback", "filler_word_feedback", "overall_summary"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "submit_practice_feedback" },
    messages: [{ role: "user", content: prompt }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return structured feedback");
  }

  return toolUse.input as InterviewPracticeFeedback;
}
