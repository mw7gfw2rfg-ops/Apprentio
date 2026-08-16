import type { TranscribedWord } from "./transcribe";

// Deterministic, not AI-judged -- same philosophy as match-score.ts and
// grade-signal.ts elsewhere in this app: counting and arithmetic belong in
// plain code, not a model call, both for cost and for not hallucinating a
// count. The feedback generator (feedback.ts) takes these numbers as input
// and only supplies the qualitative judgement on top.
const FILLER_WORDS = [
  "um",
  "umm",
  "uh",
  "uhh",
  "erm",
  "er",
  "like",
  "so",
  "you know",
  "i mean",
  "basically",
  "actually",
  "kind of",
  "sort of",
] as const;

export type SpeechStats = {
  wordCount: number;
  durationSeconds: number;
  wordsPerMinute: number;
  pace: "slow" | "good" | "fast";
  longestPauseSeconds: number;
  fillerWordCount: number;
  fillerWordBreakdown: Record<string, number>;
};

// Heuristic bands, not a scientific standard -- roughly centred on typical
// recommended interview-delivery pace (~110-165 wpm), wide enough not to
// flag normal variation as a problem.
function classifyPace(wpm: number): SpeechStats["pace"] {
  if (wpm < 110) return "slow";
  if (wpm > 165) return "fast";
  return "good";
}

export function computeSpeechStats(transcript: string, words: TranscribedWord[], durationSeconds: number): SpeechStats {
  const wordCount = words.length;
  const minutes = durationSeconds / 60;
  const wordsPerMinute = minutes > 0 ? Math.round(wordCount / minutes) : 0;

  let longestPauseSeconds = 0;
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - words[i - 1].end;
    if (gap > longestPauseSeconds) longestPauseSeconds = gap;
  }

  const normalized = ` ${transcript.toLowerCase().replace(/[^a-z0-9\s']/g, " ")} `;
  const fillerWordBreakdown: Record<string, number> = {};
  let fillerWordCount = 0;
  for (const filler of FILLER_WORDS) {
    const pattern = new RegExp(`\\s${filler.replace(/\s+/g, "\\s+")}\\s`, "g");
    const matches = normalized.match(pattern);
    if (matches && matches.length > 0) {
      fillerWordBreakdown[filler] = matches.length;
      fillerWordCount += matches.length;
    }
  }

  return {
    wordCount,
    durationSeconds,
    wordsPerMinute,
    pace: classifyPace(wordsPerMinute),
    longestPauseSeconds: Math.round(longestPauseSeconds * 10) / 10,
    fillerWordCount,
    fillerWordBreakdown,
  };
}
