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
          className="h-10 w-14 cursor-pointer rounded-xl border-2 border-border bg-transparent p-1"
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          placeholder="#7fb8a0"
          maxLength={7}
          spellCheck={false}
          aria-label="Accent color hex value"
          className="w-28 rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-mono text-foreground outline-none focus-visible:border-ring"
        />
        {!valid && (
          <span className="text-xs text-destructive">Enter a 6-digit hex color</span>
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
          className="self-start rounded-xl px-5 py-2.5 text-sm font-bold transition-transform hover:-translate-y-0.5 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
          style={valid ? { backgroundColor: "#2E2A26", color: "#FAF6EF", boxShadow: `0 3px 0 ${hexInput}` } : undefined}
        >
          Save accent color
        </button>
        <button
          type="submit"
          formAction={resetAccentColor}
          className="self-start rounded-xl border-2 border-border px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-accent"
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
          ? "flex flex-col gap-2 rounded-2xl border-2 border-[#4a4033] bg-[#241f19] p-3"
          : "flex flex-col gap-2 rounded-2xl border-2 border-border bg-card p-3"
      }
    >
      <span className={dark ? "text-xs text-[#cabda9]" : "text-xs text-muted-foreground"}>
        {label}
      </span>
      <span
        className="flex h-9 items-center justify-center rounded-full px-4 text-sm font-bold"
        style={{ backgroundColor: tokens.tint, color: tokens.tintForeground }}
      >
        Preview
      </span>
    </div>
  );
}
