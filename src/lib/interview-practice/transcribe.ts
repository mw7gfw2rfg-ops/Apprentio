// OpenAI's Whisper REST endpoint, called directly via fetch rather than
// pulling in the `openai` SDK for one endpoint -- it's a plain multipart
// POST, and this project otherwise has zero OpenAI dependencies.
//
// Model is pinned to "whisper-1" specifically, not the newer
// gpt-4o-transcribe family: as of research for this feature,
// timestamp_granularities (needed for word-level timing, which pacing
// analysis depends on) is only supported on whisper-1's verbose_json
// response, not on gpt-4o-transcribe.
const WHISPER_ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";

export type TranscribedWord = { word: string; start: number; end: number };

export type TranscriptionResult = {
  text: string;
  durationSeconds: number;
  words: TranscribedWord[];
};

export class TranscriptionError extends Error {}

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new TranscriptionError("Transcription is not configured.");
  }

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(audioBuffer)], { type: mimeType }), filename);
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");

  const response = await fetch(WHISPER_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new TranscriptionError(`Transcription failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    text?: string;
    duration?: number;
    words?: { word: string; start: number; end: number }[];
  };

  if (!data.text || !data.words || data.words.length === 0) {
    throw new TranscriptionError("Transcription returned no speech -- try recording again.");
  }

  return {
    text: data.text,
    durationSeconds: data.duration ?? data.words[data.words.length - 1].end,
    words: data.words,
  };
}
