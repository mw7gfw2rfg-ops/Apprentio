"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

export function AnimatedPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  // No positional offset (no y-shift): content sits at its final position
  // from the first frame, opacity-only. A y-offset here meant clicks/taps
  // aimed at where content was about to settle could miss while it was
  // still sliding into place. Starting opacity is raised well above 0 and
  // the transition is short, so content is always legible and clickable
  // almost immediately -- this is a quick polish flourish, not something a
  // user should ever have to wait out.
  return (
    <motion.div
      className={className}
      initial={{ opacity: reduceMotion ? 0.6 : 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0.1 : 0.15, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
