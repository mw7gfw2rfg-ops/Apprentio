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
  --primary: ${light.primary};
  --primary-foreground: ${light.foreground};
  --ring: ${light.ring};
  --sidebar-primary: ${light.primary};
  --sidebar-primary-foreground: ${light.foreground};
  --sidebar-ring: ${light.ring};
}
.dark {
  --primary: ${dark.primary};
  --primary-foreground: ${dark.foreground};
  --ring: ${dark.ring};
  --sidebar-primary: ${dark.primary};
  --sidebar-primary-foreground: ${dark.foreground};
  --sidebar-ring: ${dark.ring};
}`;

  // Safe: css is built entirely from numbers computeAccentTokens derived
  // from accentColor, which is validated to /^#[0-9a-f]{6}$/i before it
  // ever reaches the database -- never raw user input concatenated in.
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
