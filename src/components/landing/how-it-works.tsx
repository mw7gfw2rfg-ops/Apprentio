"use client";

import { useState } from "react";
import { Search, Sparkles, KanbanSquare } from "lucide-react";

const FEATURES = [
  {
    key: "discover" as const,
    title: "Discover & match",
    body: "Real vacancies pulled from gov.uk's Find an Apprenticeship service and a hand-curated employer list, matched to your subjects, predicted grades, sector interest, and commute radius.",
    Icon: Search,
    tint: "bg-[var(--warm-sage)] border-[var(--warm-sage-border)]",
    iconTint: "bg-[var(--warm-sage)] text-[var(--warm-sage-foreground)]",
  },
  {
    key: "draft" as const,
    title: "AI-assisted drafting",
    body: "A tailored CV and cover letter drafted per vacancy from your own base documents — a starting point you edit and approve, not a finished submission.",
    Icon: Sparkles,
    tint: "bg-[var(--warm-sky)] border-[var(--warm-sky-border)]",
    iconTint: "bg-[var(--warm-sky)] text-[var(--warm-sky-foreground)]",
  },
  {
    key: "track" as const,
    title: "Track everything",
    body: "A single board showing every application's stage, from saved through offer, so nothing you care about gets lost in a spreadsheet.",
    Icon: KanbanSquare,
    tint: "bg-[var(--warm-peach)] border-[var(--warm-peach-border)]",
    iconTint: "bg-[var(--warm-peach)] text-[var(--warm-peach-foreground)]",
  },
];

const LABELS: Record<(typeof FEATURES)[number]["key"], string> = {
  discover: "Discovery",
  draft: "Draft",
  track: "Board",
};

export function HowItWorks() {
  const [active, setActive] = useState<(typeof FEATURES)[number]["key"]>("discover");

  return (
    <section id="how" className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
      <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
        How it works
      </h2>
      <p className="mt-2 text-muted-foreground">Tap a step to see it.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => {
          const isActive = active === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setActive(f.key)}
              className={`rounded-3xl border-2 p-5 text-left shadow-[0_20px_36px_-26px_rgba(96,74,52,0.55)] transition-transform hover:-translate-y-1 ${
                isActive ? f.tint : "border-border bg-card"
              }`}
            >
              <span
                className={`flex size-11 items-center justify-center rounded-2xl ${f.iconTint}`}
              >
                <f.Icon className="size-5" />
              </span>
              <span className="mt-4 block font-heading text-lg font-bold">{f.title}</span>
              <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-[26px] border border-border bg-card p-5 shadow-[0_30px_50px_-30px_rgba(96,74,52,0.5)] sm:p-7">
        <div className="mb-4 flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#F0B9A0]" />
          <span className="size-2.5 rounded-full bg-[#F2DFA8]" />
          <span className="size-2.5 rounded-full bg-[#B9D9C6]" />
          <span className="ml-2 text-sm font-bold text-muted-foreground">
            {LABELS[active]}
          </span>
        </div>

        {active === "discover" && (
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-secondary p-4">
              <div className="mb-3 text-sm font-extrabold">Your filters</div>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <span className="flex justify-between gap-2">
                  Sector <strong className="text-foreground">Engineering</strong>
                </span>
                <span className="flex justify-between gap-2">
                  Level <strong className="text-foreground">6</strong>
                </span>
                <span className="flex justify-between gap-2">
                  Within <strong className="text-foreground">25 miles</strong>
                </span>
                <span className="flex justify-between gap-2">
                  Grades <strong className="text-foreground">AAB predicted</strong>
                </span>
              </div>
            </div>
            <div className="grid gap-3">
              {[
                { role: "Manufacturing Engineer", meta: "gov.uk · Level 6 · Derby", pct: "88%" },
                { role: "Cyber Security Degree App.", meta: "Curated employer · Leeds", pct: "81%" },
              ].map((v) => (
                <div
                  key={v.role}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-[0_12px_22px_-18px_rgba(96,74,52,0.8)]"
                >
                  <span className="text-sm font-bold">
                    {v.role}
                    <span className="block text-xs font-medium text-muted-foreground">
                      {v.meta}
                    </span>
                  </span>
                  <span className="font-heading font-bold text-[var(--warm-sage-foreground)]">
                    {v.pct}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {active === "draft" && (
          <div className="grid items-start gap-3.5 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-secondary p-4 text-sm text-muted-foreground">
              <div className="mb-2.5 text-sm font-extrabold text-foreground">
                Your base documents
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[var(--warm-sky-border)] bg-[var(--warm-sky)] px-3 py-1.5 text-xs font-bold text-[var(--warm-sky-foreground)]">
                  base-cv.pdf
                </span>
                <span className="rounded-full border border-[var(--warm-sky-border)] bg-[var(--warm-sky)] px-3 py-1.5 text-xs font-bold text-[var(--warm-sky-foreground)]">
                  cover-letter.txt
                </span>
              </div>
              <p className="mt-3.5">Tailored per vacancy, from your own words.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4.5 shadow-[0_16px_26px_-22px_rgba(96,74,52,0.9)]">
              <div className="font-heading text-lg font-bold">Dear Hiring Team,</div>
              <div className="mt-3 grid gap-2">
                <span className="h-2 rounded-full bg-secondary" />
                <span className="h-2 w-[94%] rounded-full bg-secondary" />
                <span className="h-2 w-[76%] rounded-full bg-secondary" />
                <span className="h-2 w-[88%] rounded-full bg-secondary" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <span className="rounded-xl bg-primary px-3.5 py-2 text-sm font-bold text-primary-foreground shadow-[0_3px_0_var(--shadow-accent)]">
                  Edit draft
                </span>
                <span className="rounded-xl border-2 border-foreground px-3.5 py-2 text-sm font-bold">
                  Approve
                </span>
              </div>
            </div>
          </div>
        )}

        {active === "track" && (
          <div className="grid gap-3.5 sm:grid-cols-4">
            {[
              { name: "Saved", count: 4, cards: ["Rolls-Royce · Eng", "BAE Systems"] },
              { name: "Drafting", count: 2, cards: ["Jaguar Land Rover"] },
              { name: "Submitted", count: 3, cards: ["PwC Tech", "Network Rail"] },
              { name: "Interview", count: 1, cards: ["Siemens"] },
            ].map((col) => (
              <div key={col.name} className="min-h-[148px] rounded-2xl border border-border bg-secondary p-3.5">
                <div className="flex items-center justify-between text-sm font-extrabold">
                  {col.name}
                  <span className="font-heading text-muted-foreground">{col.count}</span>
                </div>
                <div className="mt-3 grid gap-2.5">
                  {col.cards.map((c) => (
                    <div
                      key={c}
                      className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-bold text-muted-foreground shadow-[0_8px_16px_-14px_rgba(96,74,52,0.9)]"
                    >
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
