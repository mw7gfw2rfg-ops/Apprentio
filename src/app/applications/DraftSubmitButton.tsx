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
        className="rounded-lg border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-800 transition-all hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.97] dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-900"
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
    <div className="flex w-full max-w-xs flex-col gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3.5 py-3 dark:border-indigo-950 dark:bg-indigo-950/30">
      <div className="h-1 w-full overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-950">
        <motion.div
          className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400"
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
          className="text-xs font-medium text-indigo-700 dark:text-indigo-300"
        >
          {STEPS[stepIndex]}…
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
