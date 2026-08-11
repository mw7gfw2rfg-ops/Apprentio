"use client";

import { useState } from "react";
import { computeAccentTokens, isValidHexColor, type AccentTokens } from "@/lib/accent-color";

export function AccentColorPicker({
  initialColor,
  updateAccentColor,
  resetAccentColor,
}: {
  initialColor: string;
  updateAccentColor: (formData: FormData) => void;
  resetAccentColor: (formData: FormData) => void;
}) {
  const [hexInput, setHexInput] = useState(initialColor);
  const valid = isValidHexColor(hexInput);
  const tokens = valid ? computeAccentTokens(hexInput) : null;

  return (
    <form className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <input
          type="color"
          name="accent_color"
          value={valid ? hexInput : initialColor}
          onChange={(e) => setHexInput(e.target.value)}
          aria-label="Accent color"
          className="h-10 w-14 cursor-pointer rounded-md border border-neutral-200 bg-transparent p-1 dark:border-neutral-700"
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          placeholder="#4f46e5"
          maxLength={7}
          spellCheck={false}
          aria-label="Accent color hex value"
          className="w-28 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-mono outline-none focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/10 dark:border-neutral-700 dark:bg-neutral-900 dark:focus-visible:border-indigo-400"
        />
        {!valid && (
          <span className="text-xs text-red-600 dark:text-red-400">
            Enter a 6-digit hex color
          </span>
        )}
      </div>

      {tokens && (
        <div className="flex flex-wrap gap-4">
          <PreviewSwatch label="Light mode" tokens={tokens.light} dark={false} />
          <PreviewSwatch label="Dark mode" tokens={tokens.dark} dark />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          formAction={updateAccentColor}
          disabled={!valid}
          className="self-start rounded-lg px-4 py-2 text-sm font-medium text-white transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          style={valid ? { backgroundColor: hexInput } : undefined}
        >
          Save accent color
        </button>
        <button
          type="submit"
          formAction={resetAccentColor}
          className="self-start rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium transition-all hover:bg-neutral-50 active:scale-[0.98] dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Reset to default
        </button>
      </div>
    </form>
  );
}

function PreviewSwatch({
  label,
  tokens,
  dark,
}: {
  label: string;
  tokens: AccentTokens;
  dark: boolean;
}) {
  return (
    <div
      className={
        dark
          ? "flex flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-950 p-3"
          : "flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-3"
      }
    >
      <span className={dark ? "text-xs text-neutral-400" : "text-xs text-neutral-500"}>
        {label}
      </span>
      <span
        className="flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium"
        style={{ backgroundColor: tokens.primary, color: tokens.foreground }}
      >
        Preview
      </span>
    </div>
  );
}
