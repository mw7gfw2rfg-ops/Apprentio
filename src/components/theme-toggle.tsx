"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

const noopSubscribe = () => () => {};

// theme is undefined until next-themes resolves it client-side; rendering
// the active state before that would itself cause a hydration mismatch on
// this component (separate from the <html> class flash next-themes' own
// script already prevents), so the highlight waits for mount. Using
// useSyncExternalStore rather than an effect+setState avoids the extra
// render pass entirely.
function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-sidebar-border bg-sidebar p-1">
      {OPTIONS.map((option) => {
        const isActive = mounted && theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            aria-label={option.label}
            aria-pressed={isActive}
            className={cn(
              "flex flex-1 items-center justify-center rounded-md py-1.5 transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
            )}
          >
            <option.icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
