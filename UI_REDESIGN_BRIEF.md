# Apprentio — UI Redesign Brief

> Paste this whole document into your design tool of choice as the starting prompt. It is a complete, factually-verified inventory of the current production app (read from source, not guessed) — every page, section, button, dialog, and animation that exists today, plus the current design tokens. Nothing here is aspirational; it's a snapshot of what's live right now.

## What Apprentio is

A web app for UK sixth-formers (16–18) to discover degree apprenticeship vacancies matched to their subjects/grades/sector interest/commute radius, get an AI-drafted CV and cover letter per vacancy, and track every application through a board (saved → drafting → ready for review → approved → submitted → interview → offer/rejected/withdrawn). It **never** auto-submits anything — every application requires explicit human approval before the student marks it submitted themselves on the employer's own site. That guarantee is load-bearing copy repeated across the landing page, terms, and privacy policy — preserve it exactly, in tone and placement, wherever it appears.

Free tier: full discovery/matching/tracking, 2 free AI drafts. Premium (£7.99/mo): unlimited AI drafting, AI interview-prep question generation, audio interview-practice with feedback.

## Non-negotiables — preserve these exactly

- **Every button, form field, dialog, and flow listed below must keep its function.** Visual redesign is fully open; removing or hiding a control, or changing what an action does, is not — flag it back rather than silently dropping something.
- **The "you always press submit" guarantee** — appears on the landing page trust section, and is echoed in Terms. Must stay prominent, not buried.
- **Destructive actions keep their friction**: account deletion requires typing the literal word "DELETE"; rejecting a draft requires a non-empty reason. Don't smooth these into single-click actions.
- **Accessibility work already done must not regress**: keyboard tab order through the sidebar (a real bug was fixed here — a `position: fixed` sidebar broke sequential focus navigation; if a redesign reintroduces a similar fixed-position off-flow region, re-verify tab order), labelled form inputs (`label[for]` + `input[id]` pairs, not implicit label-wrapping), WCAG-contrast-checked accent-color text-on-background pairing (see design tokens below), `prefers-reduced-motion` support on every animation.
- **CSP is `script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`** — no external fonts/scripts/analytics can be added without a CSP change; keep any new inline styles minimal and centralized like the existing accent-color injection.
- **Mobile-responsive down to ~390px** is a hard requirement (this audience is disproportionately mobile-first) — Tailwind's `sm: 640px` is currently the only breakpoint in active use below desktop; there is no custom narrower breakpoint anywhere.

## What's fully open to reinterpretation

Visual language, color system beyond the accent mechanism, typography scale, iconography, spacing/density, the split between shadcn-style components vs. custom-built ones, the balance of card-based vs. list-based layouts, and all motion/animation design (the current motion is minimal — see below — there's a lot of room here).

---

## 1. Current design tokens (exact values, from `globals.css`)

Tailwind v4, CSS-based theming (`@theme inline`), no separate config file. All colors are `oklch()`.

**Light mode:**
- Background `oklch(1 0 0)` (white), Foreground `oklch(0.145 0 0)` (near-black)
- Primary (indigo-600 equivalent) `oklch(51.1% 0.262 276.966)`
- Secondary/Muted/Accent `oklch(0.97 0 0)`, Muted-foreground `oklch(0.556 0 0)`
- Destructive `oklch(0.577 0.245 27.325)`
- Border/Input `oklch(0.922 0 0)`, Ring `oklch(58.5% 0.233 277.117)`
- Base radius `0.625rem`, derived scale: sm `×0.6`, md `×0.8`, lg `×1`, xl `×1.4`, 2xl `×1.8`, 3xl `×2.2`, 4xl `×2.6`

**Dark mode:** Background `oklch(0.145 0 0)`, Foreground `oklch(0.985 0 0)`, Primary one step lighter `oklch(58.5% 0.233 277.117)` for contrast, Destructive `oklch(0.704 0.191 22.216)`, Border `oklch(1 0 0 / 10%)`. Same radius (no dark override).

**Fonts:** Geist Sans (body + headings, no separate display face) + Geist Mono, both self-hosted via `next/font/google`, no external font requests. Fallback stack `ui-sans-serif, system-ui, sans-serif`.

**Icons:** `lucide-react`, ~18 distinct icons currently in use across the whole app (ArrowRight, ArrowUpRight, CheckCircle2, ChevronDown/Right/Up, Circle, CreditCard, KanbanSquare, Monitor, Moon, Search, ShieldCheck, Sparkle, Sun, etc.) — a genuinely small icon vocabulary, room to expand.

**User-customizable accent color:** Users pick any hex in Settings. `computeAccentTokens()` preserves the chosen hue/saturation but clamps lightness (light mode `38–55`, dark mode `55–72`) and computes ring/foreground via a WCAG contrast check (threshold `0.179` relative luminance) against near-white/near-black. Injected via a server-rendered `<style>` tag placed after compiled CSS so there's zero flash-of-default-color and zero client JS. **Preserve this mechanism or an equivalent** — it's a real, working personalization feature.

**Component primitives:** Built on `@base-ui/react` (not Radix). Existing primitive set: Avatar, Badge, Button, Card, Dialog, DropdownMenu, Input, Label, Select, Separator, Sheet, Sidebar, Skeleton, Textarea, Tooltip. Button has 6 variants (default/outline/secondary/ghost/destructive/link) × 8 sizes (default/xs/sm/lg + icon/icon-xs/icon-sm/icon-lg), with a subtle press-down micro-interaction (`active:translate-y-px`) already built in.

## 2. Current motion — what exists today (minimal, room to grow)

- **Page transitions**: opacity-only fade, `0.4→1` opacity over `150ms` ease-out (`100ms` at `0.6→1` under reduced-motion) — deliberately no y-offset/slide, because an earlier version's slide caused clicks to land on content still moving.
- **Route-loading indicator**: a 2px indeterminate bar at the top of the content area, slides `-100%→400%` over `1.1s` linear-ish loop, only under `prefers-reduced-motion: no-preference`.
- **Onboarding subject-row list**: rows animate in/out with height/opacity/y via Framer Motion `AnimatePresence`, spring-based.
- **Kanban board card transitions**: cards use `LayoutGroup`/shared-layout animation for enter/exit and cross-column repositioning — critically damped spring (`bounce: 0, duration: 0.4s`). **This is animated re-layout, not drag-and-drop** — there is no drag interaction anywhere in the app currently.
- **AI-drafting "fake progress" bar**: a deliberately-paced (not real-progress) width animation from 4%→92% over 14 seconds with a rotating caption, calibrated to the typical real draft duration, plus a pulsing glow effect.
- **Button press feedback**: plain CSS `active:scale-[0.97]`/`translate-y-px`, not spring-based.
- Everything above respects `prefers-reduced-motion`.

There is **no direct-manipulation/gesture-driven UI anywhere** (no drag, no swipe, no velocity handoff) — if the redesign wants to introduce any (e.g. swipeable board columns, a draggable kanban), treat that as new interaction design, not a port of existing behavior, and apply proper spring physics (see the Motion Quality Bar below) rather than fixed-duration CSS transitions, since anything a user can grab should be interruptible.

## 3. Known visual inconsistency to resolve

Auth/marketing pages (`/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, onboarding, `/account/delete`, `/admin`) are hand-styled with raw Tailwind `<input>`/`<button>` elements and a **hardcoded indigo focus ring** (`focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10`), while the rest of the app (dashboard, discovery, applications, board, settings) uses the shadcn-style component library driven by the user's accent-color CSS variables. This means a user who picks a custom accent color still sees hardcoded indigo on login/signup/onboarding. **This should be unified** — pick one system and apply it everywhere, most likely extending the accent-token-driven component library to the auth/marketing shell too.

## 4. Motion quality bar for anything new (guidance, not a mandate to change existing behavior)

If you introduce new interactive/gesture-driven elements, apply this instead of default CSS transitions:
- Anything the user can grab (drag, swipe, resize) needs 1:1 tracking during the gesture and a spring — not a fixed-duration animation — on release, so it can be re-grabbed and reversed mid-flight.
- Default to a critically-damped spring (no overshoot) for most UI motion; reserve a slight bounce for things that follow a flick/throw gesture specifically.
- Respond to press on pointer-down, not release.
- Keep enter/exit paths symmetric (a panel that opens from the right should close to the right) and anchor popovers/menus to their trigger element.
- Any new translucent surface (a sheet, a floating toolbar) should use `backdrop-filter` with content scrolling underneath, not an opaque bar — and must have a `prefers-reduced-transparency` fallback to a solid background.
- Every new animation needs a `prefers-reduced-motion` equivalent (a plain cross-fade, no slide/spring/parallax).

---

## 5. Full page-by-page inventory

### Landing page (`/`, signed-out only)
- Header: logo/wordmark → `/`; outline "Log in" button.
- Hero: Badge "For UK sixth-formers", H1, description, two CTAs — primary "Sign up free" (with arrow icon), outline "Log in".
- 3-up feature card grid: "Discover & match" (Search icon), "AI-assisted drafting" (Sparkles icon), "Track everything" (Kanban icon).
- Trust section: ShieldCheck icon, "You always press submit — never us." + guarantee paragraph.
- Pricing: two side-by-side cards, Free (bullets: match, save/track, "2 free AI-drafted applications, to try it out") vs Premium (highlighted ring, "£7.99/mo" badge, "unlimited AI-drafted CVs and cover letters").
- Final CTA: H2 + large primary "Sign up free" button.
- Footer: Privacy Policy / Terms of Service links.

### `/login`
- Wordmark, H1 "Welcome back", subtext.
- Conditional banners: password-reset-success (green), error (red).
- Fields: Email (required), Password (required) with inline "Forgot password?" link next to the label.
- Submit "Log in".
- Footer: "No account? Sign up", Privacy/Terms links.

### `/signup`
- Two states: check-email ("Check your email" + confirmation copy) vs form (H1 "Create an account").
- Fields: Email (required), Password (required, min 8 chars, hint text).
- Submit "Sign up".
- Footer: "Already have an account? Log in" + ToS/Privacy agreement line.

### `/forgot-password`
- Two states: check-email confirmation vs form (Email field, submit "Send reset link", "Back to log in" link).

### `/reset-password`
- Server-guarded (requires valid recovery session, else redirects with an error).
- H1 "Set a new password" + "Choose a new password for {email}."
- Field: New password (required, min 8), submit "Update password". No footer links.

### `/onboarding`
- H1 "Tell us about you" + "This drives which apprenticeships you're matched to."
- **Profile form**, sections top to bottom:
  1. Full name + School year (2-col).
  2. **Subjects & grades** — dynamic repeating row list (subject text + predicted-grade select + actual-grade select + remove button), animated add/remove, "+ Add subject" button. Remove disabled when only one row remains.
  3. Sector interest — checkbox group (Cybersecurity, Software Engineering, Data & AI, Finance & Professional Services, Engineering, Government & Defence, Consulting, Other).
  4. Postcode + Max commute (select: 15/30/45/60/90/120 min) + Minimum apprenticeship level (select: Level 2–7).
  5. Right to work in the UK — required Yes/No radio.
  6. Eligible for security clearance (SC/DV)? — Yes/No/Not sure radio, defaults "Not sure".
  - Submit "Save & continue".
- **Base documents form** (separate, multipart): CV file input + Cover letter file input (each shows a "(view current)" link if already uploaded), accepts `.pdf,.txt` up to 5MB, submit "Upload".

### `/dashboard`
- H1 "Dashboard" + "Signed in as {email}".
- Conditional banners: error, checkout-success, checkout-cancelled.
- 3-card grid:
  1. **Applications** — total count + in-progress/submitted/offers breakdown; "View board" + "Manage applications" buttons.
  2. **Discover apprenticeships** — description + "Browse apprenticeships" primary button.
  3. **Account** — tier badge; body copy (unlimited AI vs "{n} free draft(s) remaining"); "Manage subscription" (premium) or "Upgrade to Premium — £7.99/mo" (free) button.

### `/discovery`
- H1 "Discover apprenticeships" + subtext with live postcode/commute values.
- Conditional notices: geocode failure, no-minimum-level-set, no-CV, no-sectors-mapped, zero-results — each with a fix-it link where relevant.
- **Filters bar**: sector pill toggles (multi-select), Minimum level / Commute radius / Closing-within selects, Starts-by date input, conditional "Clear filters" ghost button. All filter changes update the URL without a full reload.
- **Results**: desktop = split-pane (list left, sticky detail pane right, click selects without navigating); mobile = sequential (list → dedicated detail page). Breakpoint is exactly Tailwind's `lg:` (1024px).
- Each result card: role/employer, badges (distance, level, closing date, grade-eligibility, personalized grade-match, CV-match score), a "Save"/"✓ Saved" button.
- Detail pane states: empty ("Select a vacancy…"), loading, error, loaded (renders the same content as the standalone vacancy page).

### `/vacancies/[id]` (standalone detail page, and the desktop split-pane content)
- "← Back to Discover" link.
- Header: role title, employer, "See employer reviews on Higherin ↗" link, Save button.
- Badge row: level, sector(s), location, closing date, start date, grade-eligibility, grade-match.
- "Match with your CV" card (score + matched keywords + upgrade nudge for free tier) — or a no-CV empty state.
- "About this employer" card (only if researched data exists): summary, values & culture, notable facts, source link.
- Facts grid (wage, hours, duration, positions, training provider, working week — gov.uk listings only, each conditional on presence).
- Description, About the employer, Training you'll receive, Entry requirements (bulleted), Skills (badges), What happens next — all conditional sections.
- Footer: "View original listing ↗" or "View on {Employer}'s site ↗".

### `/applications`
- H1 "My applications" + tier badge + free-drafts-remaining text.
- "Add manually" dialog trigger (top right).
- Empty state: "Nothing saved yet — save a vacancy from Discover apprenticeships first."
- **Add-manually dialog**: Employer / Role title (required) / Listing URL (optional) / Closing date (optional) fields, submit "Add application".
- **Per-application card** (the densest surface in the app):
  - Header: role, employer, **readiness indicator** (tooltip-explained row of check/circle icons, "{n}/{total} ready"), stage badge.
  - Content varies by stage:
    - `saved`: draft button (or upgrade-nudge / missing-docs message / manual-entry submit-shortcut), free-drafts-remaining caption.
    - `ready_for_review`: **"Review draft" dialog** — editable CV + cover-letter textareas, "Save edit" and "Approve" buttons; separate **reject form** (required reason field + "Reject" button).
    - `approved`: **"View final documents" dialog** (read-only), apply-link, "Mark as submitted" button.
    - `submitted`: plain timestamp text.
    - `rejected`: **private reflection note** (collapsed "Add a note" → textarea + "Save note", never shown as an application-event, purely personal).
  - **Interview prep** section (once submitted/interview/offer/rejected/withdrawn) — see below.
  - Footer: "View on Find an Apprenticeship ↗" / "View listing ↗" link.
- **Draft button** has a distinctive fake-progress state (see Motion section) while the AI call runs.

### Interview prep dialog (opened from an application card)
- Title "Interview prep — {employer}"; government/national-security employers get an extra vetting-specific warning block.
- **4-way format toggle**: Online tests / Video interview / Assessment centre / Panel interview (pill buttons, single-select).
- Static explainer content per format (headings, paragraphs, bullet lists, an optional external practice link).
- **AI question generation** (Video/Panel formats only, premium-gated): "Generate questions" button → question list (each with a "why asked" caption) + "Talking points" + "Regenerate" button. Free tier / manual entries see an explanatory disabled state instead.
- **Audio practice tool** (per generated question, Video/Panel only): collapsed "Practice this answer" → record (with live timer, auto-stops at 3 min) → playback → submit for feedback → results (words-per-minute + pace, filler-word count, duration, plus Content/STAR/Pacing/Filler-words/Overall feedback sections) → "Practice again".

### `/board`
- H1 "Application board" + subtext.
- 6 visual columns (Saved / In progress / Approved / Submitted / Interview / Closed — a display grouping over 9 real underlying stages), horizontal snap-scroll on mobile, grid on desktop.
- Cards animate in/out and reposition between columns (shared-layout spring, not drag-and-drop).
- Each card: role/employer, stage sub-label if the column merges stages, conditional date captions, "Manage →" link.
- **Manual stage-change control** — only on submitted/interview cards: a select (only the legitimately-reachable next stages) + "Go" button.
- Empty column state: "—".

### `/account/settings`
- H1 "Settings" + description.
- **Accent color picker**: native color swatch input synced to a hex text field, inline validation, live Light-mode/Dark-mode preview chips, "Save accent color" (disabled if invalid) + "Reset to default" buttons.

### `/account/delete`
- H1 "Delete my account".
- Explicit bulleted list of everything that gets deleted (profile, documents, applications + AI content, subscription).
- Bold "This can't be undone."
- Confirmation field requiring the literal text "DELETE", destructive "Permanently delete my account" button.

### `/admin` (single hardcoded admin email only)
- Plain functional CRUD, not the polished component library: per-employer edit forms (name/portal type/portal URL/verified level/notes), "Add employer" form, "Add curated vacancy" form (employer select, role, level, dates, apply URL, standard reference, location, postcode, sectors, description).

### `/privacy` and `/terms`
- Static content, amber "draft — not legally reviewed" disclaimer at top of both, standard `h2`/`p`/`ul` sections, inline `mailto:` and cross-links.

### Persistent left sidebar (all `(app)` pages)
- Logo/wordmark → `/dashboard`.
- Nav: Dashboard, Discover, Applications, Board, (Admin — admin only). Active-state highlighting, tooltips when collapsed to icon-only.
- Footer: 3-way theme toggle (Light/Dark/System), account dropdown (avatar-initial + email + tier badge → Manage subscription/Upgrade, Settings, Delete account (destructive-styled), Sign out).
- Collapsible to icon-only width; theme toggle hides in that state.

---

## 6. Empty/edge states catalogue (don't lose these when redesigning)

"Nothing saved yet…", empty board column "—", discovery zero-results notice, discovery detail-pane empty/loading/error states, no-CV nudges (two places: discovery banner, vacancy detail card), no-sectors-mapped notice, geocode-failure notice, disabled "Upgrade to…" buttons with explanatory tooltips (draft limit / interview-prep generation / practice feedback), manual-entry explanatory text in place of AI features that don't apply to it.

---

Use this document as ground truth for "what exists and must keep working." Everything visual is yours to reinterpret.
