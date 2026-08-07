# Apprentio — Live UX/Workflow Review

**Method:** Real browser interaction against production (`https://apprentio.vercel.app`) via the claude-in-chrome extension — actual clicks, typing, keyboard-only tabbing, DOM/JS inspection for root causes, and one real Anthropic-backed "Generate interview questions" call. Not a code read-through; every finding below was reproduced live and, where useful, root-caused via `window`/DOM inspection. `CLAUDE.md` and `PLAN.md` were read in full first for intent and rules.

**Accounts used:**
- Archie's existing dogfood account (`archierichardson73+apprentiofix0806@gmail.com`) — Premium, 2 real applications already in progress. Used for everything that needs a confirmed/premium account (Discover, Applications, Board, Interview prep, Settings, keyboard-nav audit). **Restored to its original state before finishing** (accent colour reset to default indigo, theme reset to Light).
- A fresh disposable account (`richardson.archie+apprentio-uxreview@yahoo.com`) — created via real signup, confirmation email genuinely sent. **Blocked before completion — see Testing Limitations.**

---

## Testing limitations (read this first — nothing below is fabricated)

1. **Email confirmation could not be completed.** I do not have access to the `richardson.archie@yahoo.com` Yahoo inbox in this session (not logged in, and per my safety rules I will not enter a Yahoo password on Archie's behalf). Signup itself was completed and verified (see Signup section), but I could not click the confirmation link, so I could not reach: first-run onboarding as a genuinely new user, the dashboard's first-run/empty state, or a genuine **free-tier** (non-premium) view of Discovery/Applications/Board/Interview-prep. Everything premium-tier below was tested on Archie's existing account instead, which is explicitly noted per finding.
2. **Mobile (390px) viewport could not be tested.** `resize_window` reports success but has no effect in this session — `window.innerWidth`/`innerHeight` stayed fixed at 1512×831 through every attempt (390×844, 800×600, 1000×700 all "succeeded" and changed nothing). This looks like a fixed remote-display constraint of the current browser-control session, not an app issue. **No mobile findings are reported below** — this needs a real device or Chrome DevTools responsive mode in a normal (non-remote) session.
3. **Account deletion was not tested.** It requires a confirmed account I could complete signup on; blocked by #1. The "Delete account" menu item is visible and present (confirmed via the account dropdown) but the flow itself was not exercised.
4. Two consecutive signup attempts for the same address tripped Supabase's own email-send rate limit, which is itself a finding (see Signup section) but also closed off retrying #1 within this session.

---

## Findings by severity

### Blockers

**B1 — "Review draft" dialog (Applications) is un-scrollable; the heading and all action buttons are unreachable.**
Page: `/applications`, on any `ready_for_review` application → **Review draft**.
Reproduction: opened the dialog for the Unisys application (already drafted on Archie's account, no new Anthropic call). The dialog opens already showing the tail of the CV / start of the cover letter — never the top. Tried to scroll to the top/bottom via: mouse wheel over the textareas, mouse wheel over the dialog backdrop between the two text boxes, `Home` key, and `scroll_to` by element ref. **None worked** — the dialog is permanently stuck at the same scroll offset.
Root cause (confirmed via `getComputedStyle`/`getBoundingClientRect`): the dialog is a `position:fixed; top:50%; left:50%; transform:translate(-50%,-50%)` div with `overflow-y: visible` and no `max-height`. Its content is **1409px tall in an 831px viewport**; `document.body` has `overflow:hidden` (Radix's scroll lock while a dialog is open). There is no scrollable container anywhere in the stack, so roughly the top third (the heading "4 Year Technical Degree Apprentice…", the instruction text, and the top of the CV field) and the bottom quarter (the **Save edit**, **Approve** buttons) are permanently off-screen with no way to reach them by mouse or keyboard.
I could only close the dialog and click the buttons at all by using the automation tool's ref-based click, which bypasses visual position — a real mouse-only user has no equivalent.
Contrast: the **Interview prep** dialog on the same page correctly has `overflow-y:auto` with a real scrollbar and scrolls perfectly — this is a regression/miss in one specific dialog, not a global pattern, so it should be a quick, contained fix (likely just missing the `max-h-[…] overflow-y-auto` classes shadcn's Dialog usually ships with).
**Impact:** on any laptop-height viewport around ~830px or shorter (extremely common), a paying Premium user cannot approve, edit, or reject their AI-drafted CV/cover letter — the entire drafting feature's payoff step is unusable. This is the single most severe issue found.

**B2 — No password-reset flow exists anywhere.**
- No "Forgot password?" link on `/login`.
- `/forgot-password` and `/reset-password` both silently redirect to `/login` (treated as just another protected route) with zero explanation.
Confirmed the login form itself works correctly and shows a clear "Email not confirmed" error for an unconfirmed account — so error handling elsewhere is fine, this is a genuinely missing flow, not a hidden/misrouted one.
**Impact:** for a live product where V1+ users (PLAN.md) are other sixth-formers self-registering, anyone who forgets their password has no self-serve way back into their account.

### Major

**M1 — Raw backend error strings are shown to users verbatim.**
Reproduced twice on `/signup`:
1. Re-submitting the exact same (already-accepted, already-emailed) address a second time returned: `Email address "richardson.archie+apprentio-uxreview@yahoo.com" is invalid` — misleading, since that address had just been validated and mailed successfully moments earlier.
2. A further attempt returned Supabase's own internal string, unstyled and unexplained: `email rate limit exceeded`.
Neither message is written for a sixth-former end user, neither explains what actually happened (already registered, pending confirmation, try again in N minutes) or what to do next.

**M2 — Accent colour system doesn't apply everywhere its own copy claims.**
Settings (`/account/settings`) states: *"Used for primary buttons, the active nav item, and focus states — in both light and dark mode."*
Live test: saved a custom accent colour (`#dc2626`, red) and confirmed via a success toast + visible re-theme. **Correctly recoloured:** the logo mark, the avatar, Dashboard's "Browse apprenticeships" primary button, the "Premium" badge, and Discover's filter pills and distance-mile badges.
**Did not recolour:** the Board page's "Go" status-update button (stayed the original indigo), the stage-indicator dots on the Board columns (stayed indigo/purple), and the sidebar's active-nav-item highlight (stayed neutral grey — only a faint accent-tinted ring is visible on close zoom).
This is exactly the kind of "missed during a later migration pass" issue flagged as a risk going in — **Board is the clear outlier** component. (Reset back to default indigo/light before finishing, confirmed restored.)

**M3 — Entire primary sidebar is unreachable by keyboard.**
Reproduced repeatedly, both directions, on `/dashboard`: clicking into empty page body then pressing `Tab` moves focus **Sidebar-toggle icon → straight into the first button in the main content ("View board")** — completely skipping the four nav links (Dashboard/Discover/Applications/Board), the Light/Dark/System theme buttons, and the account-menu trigger. `Shift+Tab` from that first main-content button goes straight back to the sidebar-toggle icon, confirming those elements aren't in the tab sequence in either direction.
**Impact:** a keyboard-only user can never Tab to Discover/Applications/Board, never reach the theme switcher, and never reach Settings/Manage subscription/Sign out/Delete account — the entire left-hand navigation, which is how this app is structured to be used, is invisible to keyboard navigation.

**M4 — Login and signup email/password inputs have no accessible name.**
Confirmed via DOM inspection on both `/login` and `/signup`: the `<input type="email" name="email">` and `<input type="password" name="password">` have no `id`, no `aria-label`, no `aria-labelledby`; the visible "Email"/"Password" text above each field is not linked via `<label for>`. A screen-reader user gets only the input's bare type semantics, not an actual field name — on the very first form every single user encounters, before they've done anything else. (By contrast, icon-only buttons elsewhere in the app — theme switcher, sidebar toggle — do carry proper `aria-label`s, so this isn't a systemic pattern, just the auth form specifically.)

**M5 — Terms of Service contradicts PLAN.md on what the free tier includes.**
Live ToS (`/terms`): *"The free tier covers vacancy discovery and application tracking, with **two AI drafts included**... The premium tier... unlocks unlimited AI drafting."*
`PLAN.md` § Subscription model (read at the start of this session, confirmed by Archie 2026-08-05): free tier gets *"No AI-drafted CV/cover letter — student manages their own documents outside the app."* Zero free drafts, drafting is exclusively premium.
These are flatly contradictory. I could not verify which one the server actually enforces (blocked on reaching a confirmed free-tier account — see Testing Limitations), so I can't tell you which side is wrong, only that **one of them is**, and it's a live legal document making a concrete, currently-unverifiable promise to real users about a product mechanic that gates real Anthropic API cost. This needs reconciling before Phase 2 signups start.

### Minor

**m1 — Login re-onboards an already-onboarded returning user.**
Logging into Archie's existing account (Premium, 2 real applications, fully onboarded) via the `/login` form redirected to `/onboarding`, correctly pre-filled with his real profile data, before reaching the dashboard. Navigating straight to `/dashboard` afterward worked immediately with no re-onboarding step. Not destructive (nothing was lost or reset), but it's a pointless, mildly alarming extra step ("do I need to redo this?") apparently on *every* login, not just first login.

**m2 — Duplicated content in a vacancy listing.**
Discover → "4 Year Technical Degree Apprentice (IT & Technology)", Unisys Limited: the **Description** and **What happens next** sections show the identical bullet list verbatim (Technical Support / Software Development / Data Analytics & Reporting / Networking & Infrastructure / Project Coordination & Business Support). "What happens next" should describe application-process next steps, not repeat the role description — looks like a scrape/generation slip for at least this one listing; worth spot-checking others.

**m3 — Three "Save" buttons, two of them dead.**
Settings → Accent colour: the Light-mode and Dark-mode preview swatches each contain a button literally labelled **"Save"**, styled identically to the real action button below. Confirmed by clicking: no toast, no network activity, no change — they're pure previews of how the accent looks against each theme's background. The real action is the separate **"Save accent color"** button. Understandable once you know, easy to misread on first encounter — worth renaming the preview labels (e.g. drop the "Save" wording, or make them visibly non-interactive) rather than sharing the exact same label as the live action right next to it.

**m4 — No public landing page.**
Visiting `https://apprentio.vercel.app/` signed-out redirects straight to a bare `/login` form — no explanation of what Apprentio is, no value proposition, nothing. Fine for the current Archie-only dogfood phase, but worth flagging against PLAN.md's Phase 2 goal of self-registering sixth-formers: cold traffic hitting a bare credential form with zero context is a real drop-off risk when that phase starts.

**m5 — Page-transition fade-in reads as "is this broken."**
On essentially every full navigation (signup, login, onboarding→dashboard, etc.) the new page renders at very low opacity for roughly 0.5–1.5s before reaching full contrast. Several of my early clicks/types in this session landed during that window and had to be redone. Likely intentional, but it's slow and washed-out enough to cost trust rather than read as polish, especially combined with m6 below.

**m6 — No loading indicator on client-side route changes.**
Clicking a sidebar link sometimes shows no visible change for ~1 second (old page stays static, no spinner/skeleton) before the new page renders. Stacked with m5, this produced repeated "did my click register?" moments through the whole session — several nav clicks needed a second click before I realised it was just latency.

**m7 — Auth pages never respect dark mode.**
`/login`, `/signup`, the "check your email" confirmation screen, `/privacy`, and `/terms` are all permanently light-themed with no theme toggle, while every authenticated page fully supports Light/Dark/System. A dark-mode user who signs out gets a jarring bright-white flash. A real seam in "does every page feel like the same product."

### Polish (mostly positive — worth protecting)

**p1 — Privacy Policy and Terms of Service are genuinely good.** Both explicitly self-label **"Draft — not legally reviewed"** at the top, exactly matching PLAN.md's own instruction to flag rather than silently ship. Content is specific to what the app actually does — names Anthropic/Stripe/Supabase by their actual role, states plainly that right-to-work/security-clearance fields are self-reported and unverified, and states the no-auto-submit rule in plain terms ("you always submit it yourself on the employer's own site"). This is the clearest example in the app of the intended "considered, restrained" tone — genuinely not generic boilerplate.

**p2 — Interview prep content is specific, not AI-templated filler.** Names SHL/Cubiks/Talogy/Kenexa by name for online tests, correctly distinguishes traditional vs. Cappfinity strengths-based SJTs (a real, non-obvious distinction), gives concrete UK-apprenticeship-specific advice (STAR structure, DofE as a talking point). The "Generate questions" AI action (tested live, one real Anthropic call) showed a clear "Generating…" state and produced genuinely role-specific, non-generic practice questions and talking points.

**p3 — Honest failure states where I could check them.** "Manage subscription" on Archie's billing-less Phase-1 test account failed with a clear, legible **"No billing account found"** banner rather than a silent no-op or crash — correct given PLAN.md Phase 1 explicitly has no billing wired up yet. Login correctly and clearly refuses an unconfirmed account ("Email not confirmed") rather than silently failing.

**p4 — Copy honesty on the no-auto-submit rule is consistent everywhere I could check it.** Applications/Board use "Mark as submitted" (not "Submit"), the ToS states the rule in plain language, and nothing I found implies the app ever acts for the student. This was an explicit thing to check and I found no violations.

---

## What worked well / consistency notes

- Dashboard, Discover, Applications, Board, and Interview-prep all genuinely feel like one shadcn-based system in both light and dark mode — consistent card shapes, badge styles, spacing. Dark mode contrast looked solid throughout on visual inspection (no automated contrast audit was completed — see note below).
- Discover's vacancy detail pane (employer "about" section, wage/hours/duration/training-provider grid, skills tags, "View original listing" external link) is well-organised and reads as genuinely researched, not templated.
- Board's six-column kanban (Saved/In progress/Approved/Submitted/Interview/Closed) with per-card manual status dropdown matches PLAN.md's tracking spec exactly.
- Keyboard focus rings are strong and clearly visible wherever an element **is** reachable (auth form fields, the elements that do sit in tab order) — the problem in M3 is elements missing from the sequence entirely, not weak focus styling.
- A note on method: I did not run an exhaustive automated colour-contrast audit (a script-based pass returned no usable results and I didn't want to over-invest given the other findings); everything on contrast above is from direct visual inspection across light/dark, which looked good everywhere I checked but isn't a substitute for a WCAG-ratio sweep.

## Not tested (see Testing Limitations for why)

- First-run onboarding and dashboard as a genuinely new, just-confirmed user.
- Free-tier (non-Premium) view of Discovery, Applications, Board, and Interview-prep — in particular, whether the "Draft" button shows the upsell copy PLAN.md describes ("Upgrade to draft a tailored CV & cover letter for this application") instead of firing, and whether the free-tier reality matches PLAN.md or the ToS (see M5).
- Account deletion flow.
- Anything at a 390px/mobile viewport.
