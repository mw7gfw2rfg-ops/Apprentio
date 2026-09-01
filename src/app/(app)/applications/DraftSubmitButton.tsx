"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const STEPS = [
  "Reading your base CV and cover letter",
  "Reading the vacancy listing",
  "Drafting a tailored CV",
  "Drafting a tailored cover letter",
] as const;

// Not a real progress signal — draftApplication is a single blocking call
// with no incremental server updates. This paces through the steps that
// roughly happen, calibrated to the draft's typical ~14s duration, and the
// bar deliberately never claims 100% until the server action actually
// returns.
const EXPECTED_MS = 14000;

export function DraftSubmitButton() {
  const { pending } = useFormStatus();

  if (!pending) {
    return (
      <button
        type="submit"
        className="rounded-xl border border-border px-4 py-2 text-sm font-bold transition-colors hover:bg-accent active:translate-y-px"
      >
        Draft
      </button>
    );
  }

  return <DraftingProgress />;
}

// Mounted fresh each time drafting starts (the parent only renders this
// while pending), so step/timer state always begins at zero with no
// reset-on-effect needed.
function DraftingProgress() {
  const [stepIndex, setStepIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const stepMs = EXPECTED_MS / STEPS.length;
    const id = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, stepMs);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glow-pulse flex w-full max-w-xs flex-col gap-2 rounded-2xl border border-[var(--warm-sky-border)] bg-[var(--warm-sky)]/50 px-4 py-3">
      <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--warm-sky-border)]">
        <motion.div
          className="h-full rounded-full bg-[var(--warm-sky-foreground)]"
          initial={{ width: "4%" }}
          animate={{ width: "92%" }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: EXPECTED_MS / 1000, ease: [0.16, 1, 0.3, 1] }
          }
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={stepIndex}
          initial={reduceMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="text-xs font-bold text-[var(--warm-sky-foreground)]"
        >
          {STEPS[stepIndex]}…
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
