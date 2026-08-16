"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { submitInterviewPracticeAnswer } from "@/app/(app)/applications/interview-practice-actions";
import type { InterviewPracticeFeedback } from "@/lib/interview-practice/feedback";

// Matches the app's own documented video-interview answer window
// (interview-prep/content.ts: "commonly 1-3 minutes") and bounds the
// server-side payload/cost ceiling.
const MAX_RECORDING_SECONDS = 180;

const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus", "audio/ogg"];

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const type of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Stage = "idle" | "recording" | "recorded" | "submitting" | "result" | "error";

type ResultData = {
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

export function InterviewPracticeRecorder({
  applicationId,
  question,
  whyAsked,
  format,
}: {
  applicationId: string;
  question: string;
  whyAsked: string;
  format: "video_interview" | "panel_interview";
}) {
  const [expanded, setExpanded] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    mediaRecorderRef.current?.stop();
  }

  async function startRecording() {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices || typeof MediaRecorder === "undefined") {
      setStage("error");
      setError("Audio recording isn't supported in this browser.");
      return;
    }
    const mimeType = pickMimeType();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        stopStream();
        setStage("recorded");
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      setStage("recording");
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          if (next >= MAX_RECORDING_SECONDS) stopRecording();
          return next;
        });
      }, 1000);
    } catch {
      setStage("error");
      setError("Microphone access was denied or isn't available.");
    }
  }

  function reRecord() {
    blobRef.current = null;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setResult(null);
    setError(null);
    setStage("idle");
  }

  async function submit() {
    if (!blobRef.current) return;
    setStage("submitting");
    setError(null);
    const form = new FormData();
    form.set("application_id", applicationId);
    form.set("question", question);
    form.set("why_asked", whyAsked);
    form.set("format", format);
    const ext = blobRef.current.type.includes("mp4") ? "mp4" : blobRef.current.type.includes("ogg") ? "ogg" : "webm";
    form.set("audio", blobRef.current, `answer.${ext}`);

    const res = await submitInterviewPracticeAnswer(form);
    if (res.ok) {
      setResult(res.data);
      setStage("result");
    } else {
      setError(res.error);
      setStage("recorded");
    }
  }

  if (!expanded) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(true)}
        className="mt-2 self-start text-xs"
      >
        Practice this answer
      </Button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-lg border border-dashed p-3">
      <p className="text-xs font-medium text-muted-foreground">Practice with feedback</p>

      {stage === "idle" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Record a spoken answer to this question and get feedback on content, structure, pacing and
            filler words. Up to 3 minutes.
          </p>
          <Button type="button" size="sm" onClick={startRecording} className="self-start">
            Start recording
          </Button>
        </div>
      )}

      {stage === "recording" && (
        <div className="flex items-center gap-3">
          <span className="flex h-2 w-2 animate-pulse rounded-full bg-destructive" aria-hidden />
          <span className="text-sm tabular-nums">{formatTime(seconds)}</span>
          <Button type="button" size="sm" variant="outline" onClick={stopRecording}>
            Stop
          </Button>
        </div>
      )}

      {stage === "recorded" && (
        <div className="flex flex-col gap-2">
          {audioUrl && <audio controls src={audioUrl} className="h-9 w-full" />}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={submit}>
              Submit for feedback
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={reRecord}>
              Re-record
            </Button>
          </div>
        </div>
      )}

      {stage === "submitting" && (
        <p className="text-sm text-muted-foreground">Transcribing and generating feedback…</p>
      )}

      {stage === "error" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-destructive">{error}</p>
          <Button type="button" size="sm" variant="outline" onClick={reRecord} className="self-start">
            Try again
          </Button>
        </div>
      )}

      {stage === "result" && result && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-muted px-2 py-1">{result.stats.wordsPerMinute} wpm ({result.stats.pace} pace)</span>
            <span className="rounded-full bg-muted px-2 py-1">{result.stats.fillerWordCount} filler words</span>
            <span className="rounded-full bg-muted px-2 py-1">{Math.round(result.stats.durationSeconds)}s</span>
          </div>

          <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground/80">
            <div>
              <p className="font-medium text-foreground">Content</p>
              <p>{result.feedback.content_feedback}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">STAR structure</p>
              <p>{result.feedback.star_feedback}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Pacing</p>
              <p>{result.feedback.pacing_feedback}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Filler words</p>
              <p>{result.feedback.filler_word_feedback}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Overall</p>
              <p>{result.feedback.overall_summary}</p>
            </div>
          </div>

          <Button type="button" size="sm" variant="outline" onClick={reRecord} className="self-start">
            Practice again
          </Button>
        </div>
      )}
    </div>
  );
}
