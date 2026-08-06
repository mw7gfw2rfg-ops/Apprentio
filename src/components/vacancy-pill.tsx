import type { ReactNode } from "react";

export function Pill({
  children,
  accent = false,
}: {
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={
        accent
          ? "inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300"
          : "inline-flex items-center rounded-full border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
      }
    >
      {children}
    </span>
  );
}
