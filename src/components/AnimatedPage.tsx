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

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0.15 }
          : { type: "spring", bounce: 0, duration: 0.4 }
      }
    >
      {children}
    </motion.div>
  );
}
