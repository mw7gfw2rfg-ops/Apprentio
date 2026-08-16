"use server";

import { createClient } from "@/lib/supabase/server";
import { INTERVIEW_PREP_STAGES } from "@/lib/interview-prep/constants";
import { checkRateLimit } from "@/lib/rate-limit";
import { transcribeAudio, TranscriptionError } from "@/lib/interview-practice/transcribe";
import { computeSpeechStats } from "@/lib/interview-practice/speech-stats";
import { generateInterviewPracticeFeedback, type InterviewPracticeFeedback } from "@/lib/interview-practice/feedback";

type Result =
  | {
      ok: true;
      data: {
        transcript: string;
        feedback: InterviewPracticeFeedback;
        stats: {
          durationSeconds: number;
          wordsPerMinute: number;
          pace: "slow" | "good" | "fast";
          fillerWordCount: number;
          fillerWordBreakdown: Record<string, number>;
        };
      };
    }
  | { ok: false; error: string };

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

// Best-effort container sniff, mirroring the spirit of documents-actions.ts's
// PDF magic-number check -- MediaRecorder in a real browser only ever
// produces one of these three containers (webm on Chrome/Firefox, mp4/AAC on
// Safari, ogg on some Firefox configs), so this is enough to catch a
// renamed/non-audio file without pulling in a MIME-sniffing dependency.
function sniffAudioContainer(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  // WebM/Matroska EBML header
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return true;
  // Ogg
  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return true;
  // MP4/M4A ("....ftyp" box)
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return true;
  // WAV ("RIFF....WAVE")
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return true;
  return false;
}

// Practicing a spoken answer only makes sense against the AI-generated
// question list -- Online tests / Assessment centre are format explainers,
// not question-and-answer content (see AI_ELIGIBLE_FORMATS in
// interview-prep/constants.ts), so this only ever covers video/panel
// interview questions, the same two formats question generation is scoped
// to.
export async function submitInterviewPracticeAnswer(formData: FormData): Promise<Result> {
  const applicationId = formData.get("application_id");
  const question = formData.get("question");
  const whyAsked = formData.get("why_asked");
  const format = formData.get("format");
  const audio = formData.get("audio");

  if (typeof applicationId !== "string" || typeof question !== "string" || typeof format !== "string") {
    return { ok: false, error: "Missing required fields." };
  }
  if (!(audio instanceof File) || audio.size === 0) {
    return { ok: false, error: "No recording received." };
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return { ok: false, error: "Recording is too long -- keep answers under a few minutes." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in to practice interview answers." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("user_id", user.id)
    .single();

  if (profile?.subscription_tier !== "premium") {
    return { ok: false, error: "Upgrade to premium to get feedback on practice answers." };
  }

  const { data: application } = await supabase
    .from("applications")
    .select("id, stage")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single();

  if (!application) {
    return { ok: false, error: "Application not found." };
  }

  if (!INTERVIEW_PREP_STAGES.includes(application.stage as (typeof INTERVIEW_PREP_STAGES)[number])) {
    return { ok: false, error: "Interview prep is available once an application has been submitted." };
  }

  const rateLimit = await checkRateLimit(supabase, "interview_practice");
  if (!rateLimit.allowed) {
    return { ok: false, error: rateLimit.error };
  }

  const audioBuffer = Buffer.from(await audio.arrayBuffer());
  if (!sniffAudioContainer(new Uint8Array(audioBuffer.subarray(0, 12)))) {
    return { ok: false, error: "Recording doesn't look like a genuine audio file." };
  }

  // The audio buffer lives only in this function's memory for the duration
  // of this request -- never written to Storage, disk, or any table. Once
  // this function returns, it's discarded; only the transcript and derived
  // feedback text below are persisted (PLAN.md § Data protection).
  let transcript: string;
  let stats: ReturnType<typeof computeSpeechStats>;
  try {
    const transcription = await transcribeAudio(audioBuffer, audio.name || "answer.webm", audio.type || "audio/webm");
    transcript = transcription.text;
    stats = computeSpeechStats(transcription.text, transcription.words, transcription.durationSeconds);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof TranscriptionError ? err.message : "Could not transcribe that recording -- try again.",
    };
  }

  let feedback: InterviewPracticeFeedback;
  try {
    feedback = await generateInterviewPracticeFeedback({
      question,
      whyAsked: typeof whyAsked === "string" && whyAsked.length > 0 ? whyAsked : null,
      transcript,
      stats,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not generate feedback right now.",
    };
  }

  const { error: insertError } = await supabase.from("interview_practice_attempts").insert({
    user_id: user.id,
    application_id: applicationId,
    format,
    question,
    transcript,
    duration_seconds: stats.durationSeconds,
    words_per_minute: stats.wordsPerMinute,
    filler_word_count: stats.fillerWordCount,
    filler_word_breakdown: stats.fillerWordBreakdown,
    feedback,
  });
  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  return {
    ok: true,
    data: {
      transcript,
      feedback,
      stats: {
        durationSeconds: stats.durationSeconds,
        wordsPerMinute: stats.wordsPerMinute,
        pace: stats.pace,
        fillerWordCount: stats.fillerWordCount,
        fillerWordBreakdown: stats.fillerWordBreakdown,
      },
    },
  };
}
