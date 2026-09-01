import { computeAccentTokens, DEFAULT_ACCENT_COLOR } from "@/lib/accent-color";

// Server-rendered <style> tag overriding the accent CSS custom properties
// for this user. Placed after the compiled globals.css in document order,
// so equal-specificity :root/.dark declarations here win the cascade --
// no client-side effect, no flash of the default indigo before the user's
// choice applies. Renders nothing at all for the default color, since
// globals.css already has those exact values baked in.
export function AccentStyle({ accentColor }: { accentColor: string }) {
  if (accentColor.toLowerCase() === DEFAULT_ACCENT_COLOR) {
    return null;
  }

  const { light, dark } = computeAccentTokens(accentColor);

  const css = `
:root {
  --ring: ${light.ring};
  --shadow-accent: ${light.ring};
  --sidebar-primary: ${light.tint};
  --sidebar-primary-foreground: ${light.tintForeground};
  --sidebar-accent: ${light.tint};
  --sidebar-accent-foreground: ${light.tintForeground};
  --sidebar-ring: ${light.ring};
  --warm-sage: ${light.tint};
  --warm-sage-foreground: ${light.tintForeground};
  --warm-sage-border: ${light.ring};
}
.dark {
  --ring: ${dark.ring};
  --shadow-accent: ${dark.ring};
  --sidebar-primary: ${dark.tint};
  --sidebar-primary-foreground: ${dark.tintForeground};
  --sidebar-accent: ${dark.tint};
  --sidebar-accent-foreground: ${dark.tintForeground};
  --sidebar-ring: ${dark.ring};
  --warm-sage: ${dark.tint};
  --warm-sage-foreground: ${dark.tintForeground};
  --warm-sage-border: ${dark.ring};
}`;

  // Safe: css is built entirely from numbers computeAccentTokens derived
  // from accentColor, which is validated to /^#[0-9a-f]{6}$/i before it
  // ever reaches the database -- never raw user input concatenated in.
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
