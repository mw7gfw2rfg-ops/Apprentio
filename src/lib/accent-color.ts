// Turns a single user-picked hex color into the small set of CSS custom
// properties the design system actually needs (primary/ring for both light
// and dark mode, plus a readable foreground). Only lightness is ever
// adjusted -- hue and saturation are the user's choice and stay untouched.
// The default indigo returns the exact oklch values already baked into
// globals.css, so picking the default (or never opening settings) produces
// byte-identical output to before this feature existed.

export const DEFAULT_ACCENT_COLOR = "#4f46e5";

export type AccentTokens = {
  primary: string;
  foreground: string;
  ring: string;
};

export type AccentTokenSet = {
  light: AccentTokens;
  dark: AccentTokens;
};

const DEFAULT_TOKENS: AccentTokenSet = {
  light: {
    primary: "oklch(51.1% 0.262 276.966)",
    foreground: "oklch(0.985 0 0)",
    ring: "oklch(58.5% 0.233 277.117)",
  },
  dark: {
    primary: "oklch(58.5% 0.233 277.117)",
    foreground: "oklch(0.985 0 0)",
    ring: "oklch(67.3% 0.182 276.935)",
  },
};

const NEAR_WHITE = "oklch(0.985 0 0)";
const NEAR_BLACK = "oklch(0.145 0 0)";

export function isValidHexColor(value: string): value is string {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  s /= 100;
  l /= 100;
  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    hue2rgb(p, q, h + 1 / 3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1 / 3) * 255,
  ];
}

// WCAG relative luminance -- the actual perceptual brightness, not HSL
// lightness (which would let a pale yellow read as "dark enough" for white
// text when it's nothing of the sort).
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function foregroundFor(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return relativeLuminance(r, g, b) > 0.179 ? NEAR_BLACK : NEAR_WHITE;
}

function withLightness(hex: string, l: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s] = rgbToHsl(r, g, b);
  return rgbToHex(...hslToRgb(h, s, l));
}

function clampLightness(hex: string, min: number, max: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [, , l] = rgbToHsl(r, g, b);
  return withLightness(hex, Math.min(max, Math.max(min, l)));
}

function nudgeLightness(hex: string, delta: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [, , l] = rgbToHsl(r, g, b);
  return withLightness(hex, Math.min(92, Math.max(0, l + delta)));
}

export function computeAccentTokens(hex: string): AccentTokenSet {
  if (!isValidHexColor(hex) || hex.toLowerCase() === DEFAULT_ACCENT_COLOR) {
    return DEFAULT_TOKENS;
  }

  // Keep the user's hue/saturation; only pull lightness into a range that's
  // legible against a white (light mode) or near-black (dark mode) page.
  const lightPrimary = clampLightness(hex, 38, 55);
  const darkPrimary = clampLightness(hex, 55, 72);

  return {
    light: {
      primary: lightPrimary,
      foreground: foregroundFor(lightPrimary),
      ring: nudgeLightness(lightPrimary, 8),
    },
    dark: {
      primary: darkPrimary,
      foreground: foregroundFor(darkPrimary),
      ring: nudgeLightness(darkPrimary, 8),
    },
  };
}
