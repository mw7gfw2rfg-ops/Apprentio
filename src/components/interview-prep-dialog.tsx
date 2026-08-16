"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  AI_ELIGIBLE_FORMATS,
  PREP_FORMATS,
  type InterviewPrepFormat,
} from "@/lib/interview-prep/constants";
import { PREP_CONTENT, VETTING_SECTION, type PrepSection } from "@/lib/interview-prep/content";
import type { GeneratedInterviewPrep } from "@/lib/interview-prep/generate";
import { InterviewPracticeRecorder } from "@/components/interview-practice-recorder";

function Section({ section }: { section: PrepSection }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-sm font-semibold">{section.heading}</h3>
      {section.paragraphs.map((p, i) => (
        <p key={i} className="text-sm leading-relaxed text-foreground/80">
          {p}
        </p>
      ))}
      {section.bullets && (
        <ul className="mt-1 flex flex-col gap-1 text-sm leading-relaxed text-foreground/80">
          {section.bullets.map((b, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {section.link && (
        <a
          href={section.link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {section.link.label}
          <span aria-hidden>↗</span>
        </a>
      )}
    </div>
  );
}

export function InterviewPrepDialog({
  applicationId,
  employerName,
  isGovernment,
  isPremium,
  isManual,
  generateAction,
}: {
  applicationId: string;
  employerName: string;
  isGovernment: boolean;
  isPremium: boolean;
  isManual: boolean;
  generateAction: (
    applicationId: string,
    format: "video_interview" | "panel_interview"
  ) => Promise<{ ok: true; data: GeneratedInterviewPrep } | { ok: false; error: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<InterviewPrepFormat>("online_tests");
  const [aiResults, setAiResults] = useState<
    Partial<Record<InterviewPrepFormat, { ok: true; data: GeneratedInterviewPrep } | { ok: false; error: string }>>
  >({});
  const [isPending, startTransition] = useTransition();

  const isAiEligible = AI_ELIGIBLE_FORMATS.includes(format);
  const aiResult = aiResults[format];

  function handleGenerate() {
    if (format !== "video_interview" && format !== "panel_interview") return;
    startTransition(async () => {
      const result = await generateAction(applicationId, format);
      setAiResults((prev) => ({ ...prev, [format]: result }));
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="self-start" />}>
        Interview prep
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Interview prep — {employerName}</DialogTitle>
          <DialogDescription>
            Free format explainers for every stage, plus AI-generated practice questions for
            premium.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto pr-1">
          {isGovernment && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <Badge variant="default">Government / national security employer</Badge>
              </div>
              <Section section={VETTING_SECTION} />
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {PREP_FORMATS.map((f) => (
              <Button
                key={f.value}
                type="button"
                size="sm"
                variant={format === f.value ? "default" : "outline"}
                onClick={() => setFormat(f.value)}
                className="rounded-full"
              >
                {f.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-col gap-5">
            {PREP_CONTENT[format].map((section, i) => (
              <Section key={i} section={section} />
            ))}
          </div>

          {isAiEligible && (
            <div className="flex flex-col gap-3 border-t pt-4">
              <h3 className="text-sm font-semibold">
                AI-generated practice questions for this role
              </h3>

              {isManual && (
                <p className="text-sm text-muted-foreground">
                  AI-generated questions aren&apos;t available for manually-added
                  applications — Apprentio doesn&apos;t have the listing details it
                  needs to tailor them. The format explainers above still apply.
                </p>
              )}

              {!isManual && !isPremium && (
                <Button
                  type="button"
                  disabled
                  variant="outline"
                  title="Upgrade to premium to generate tailored interview questions"
                  className="self-start"
                >
                  Upgrade to generate tailored questions
                </Button>
              )}

              {!isManual && isPremium && !aiResult && (
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isPending}
                  className="self-start"
                >
                  {isPending ? "Generating…" : "Generate questions"}
                </Button>
              )}

              {isPremium && aiResult && !aiResult.ok && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-destructive">{aiResult.error}</p>
                  <Button type="button" variant="outline" onClick={handleGenerate} className="self-start">
                    Try again
                  </Button>
                </div>
              )}

              {isPremium && aiResult?.ok && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3">
                    {aiResult.data.questions.map((q, i) => (
                      <div key={i} className="flex flex-col rounded-lg border p-3">
                        <p className="text-sm font-medium">{q.question}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{q.why_asked}</p>
                        {(format === "video_interview" || format === "panel_interview") && (
                          <InterviewPracticeRecorder
                            applicationId={applicationId}
                            question={q.question}
                            whyAsked={q.why_asked}
                            format={format}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Talking points
                    </h4>
                    <ul className="mt-1.5 flex flex-col gap-1 text-sm leading-relaxed text-foreground/80">
                      {aiResult.data.talking_points.map((tp, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary">•</span>
                          <span>{tp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={handleGenerate} className="self-start text-xs">
                    Regenerate
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
