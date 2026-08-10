# Apprentio — TODO

Living checklist. Source of truth for what's outstanding — check items off as they're actually verified live (same bar as everything else in this project: don't check something off because code was written, check it off because it was confirmed working). Add new items here as they're discovered; don't let findings live only in chat history.

Full detail, reproduction steps, and sources for the items below are in `OVERNIGHT_SECURITY_REVIEW.md`, `OVERNIGHT_UX_REVIEW.md`, `OVERNIGHT_COMPETITOR_RESEARCH.md`, `OVERNIGHT_IMPLEMENTATION_PLAN.md`, and `OVERNIGHT_FEATURE_BRAINSTORM.md` (all in this repo root, untracked). This file is the index; those are the depth.

---

## Do first

- [x] **Fix the un-scrollable "Review draft" dialog on /applications.** Paying users currently can't reach the heading or Save/Approve/Reject on a normal laptop screen — the entire payoff of drafting is broken. Contained fix, likely just missing `max-h-[…] overflow-y-auto`. (UX B1) — Fixed: `DialogContent` is now `flex max-h-[85vh] flex-col`, with the header and `DialogFooter` (Save edit/Approve) pinned outside a `min-h-0 flex-1 overflow-y-auto` region wrapping just the two textareas. Verified live at a real ~613–858px-tall viewport on the actual Unisys `ready_for_review` application: heading and both footer buttons visible without scrolling, mouse wheel scrolls the middle content to its true end (cover letter sign-off), and Tab/Shift+Tab + Enter reaches and activates Save edit and tabs on to Approve keyboard-only.
- [x] **Fix the free-draft-limit race condition.** Concurrent requests bypass the 2-draft cap — unbounded real Anthropic cost from any free account. Fix: atomic check-and-increment (RPC/`UPDATE ... WHERE free_drafts_used < $2 RETURNING`), checked before the Anthropic call. (Security #1) — Fixed: `claim_free_draft`/`release_free_draft` SECURITY DEFINER Postgres functions (scoped to `auth.uid()`, not a passed-in id) do the atomic `UPDATE ... WHERE free_drafts_used < $limit RETURNING`, called from `draftApplication()` before `generateDraft()`/the Anthropic call, with the release called from the existing catch block on failure. Verified live against the real race, not just the happy path: created a real free-tier test account (real signup, real base CV/cover letter, 4 real saved applications), used 2 real drafts to confirm the happy path end-to-end, then reset to 1 remaining slot and fired 8 genuinely concurrent HTTP requests at the deployed `draftApplication` action (via a fetch-clone interceptor confirmed by the network log to have dispatched 8 real simultaneous POSTs) — exactly 1 succeeded, the other 7 were all correctly rejected, and `free_drafts_used` landed at exactly 2, not over- or under-counted. Also verified directly at the RPC layer beforehand (10 concurrent `claim_free_draft` calls with 1 slot remaining → exactly 1 succeeded) before wiring it into the action. All test data cleaned up afterward.
- [x] **Add a password-reset flow.** `/forgot-password` and `/reset-password` currently just redirect to `/login` with no explanation; no link on the login form either. (UX B2) — Fixed: real `/forgot-password` (resetPasswordForEmail, redirectTo built from getSiteUrl() same as the signup emailRedirectTo pattern) and `/reset-password` (updateUser, guarded server-side by requiring a valid recovery session, signs out and sends to /login on success so the new password actually gets exercised on the next real login) pages, plus both added to proxy.ts's PUBLIC_PATHS (they were unauthenticated-blocked by the proxy before, which is why they used to bounce straight to /login) and a "Forgot password?" link on the login form. Verified live end-to-end on the real dogfood account, not just that the request submits: requested a reset for the real address, read the real Supabase email via Gmail, confirmed the link's redirect_to pointed at the real production domain, clicked the real link, landed on /reset-password with a real recovery session, set a new password, got signed out and redirected to /login with a success banner, then logged in with the new password and landed back in the real account with its real data.

## Security

- [ ] Add basic per-user rate limiting on AI-calling endpoints (draft, interview-prep, employer research) — independent of the tier check, since "premium = unlimited" currently has zero technical ceiling. (Security #2)
- [ ] Decide on prompt-injection hardening — delimit untrusted vacancy/search text from instructions in the drafting and interview-prep prompts; consider a post-generation "unusual content, please check" flag at review time. Worth a deliberate decision either way, touches real employer applications. (Security #3)
- [ ] Validate actual file content on CV/CL upload (magic-number check), not just client-supplied MIME type/filename. Low-Medium — self-targeted DoS risk only, not cross-tenant. (Security #4)
- [ ] Allow-list the `next` redirect param in `/auth/callback` to same-origin relative paths only. (Security #5)
- [ ] Add baseline security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy). (Security #6)
- [ ] Confirm the hardcoded admin email in `src/lib/admin.ts` is the real operator account, not a leftover dev placeholder. (Security #7)
- [ ] Either start writing to `application_events` (it's meant to be the audit trail) or decide it's not needed and remove it. (Security #8)

## UX / accessibility

- [ ] Fix the accent-color system missing the Board page (Go button, stage dots stay hardcoded indigo regardless of the user's chosen accent). (UX M2)
- [ ] Fix keyboard navigation — the entire sidebar (nav links, theme switcher, account menu) is skipped in tab order in both directions. (UX M3)
- [ ] Add accessible names (`label for`/`aria-label`) to the login/signup email and password inputs. (UX M4)
- [ ] Replace raw backend error strings ("email rate limit exceeded") with real user-facing copy. (UX M1)
- [ ] Reconcile `PLAN.md` §7 with reality — it still says zero free drafts; the shipped product (and the ToS, correctly) gives free tier 2 drafts. Doc fix only, not a product decision. (UX M5)
- [ ] Stop re-onboarding an already-onboarded user on every login. (UX m1)
- [ ] Check other vacancy listings for the same "Description" / "What happens next" duplicated-content issue seen on the Unisys listing. (UX m2)
- [ ] Rename or de-style the two dead "Save" preview buttons in accent-color settings so they don't read as the real action. (UX m3)
- [ ] Add a real public landing page — signed-out `/` currently drops straight into a bare login form with zero context. Matters once Phase 2 opens self-registration. (UX m4)
- [ ] Look at page-transition fade-in and route-change loading state — both currently read as "is this broken" rather than polish. (UX m5, m6)
- [ ] Make auth pages (`/login`, `/signup`, `/privacy`, `/terms`) respect dark mode instead of always forcing light. (UX m7)
- [ ] Re-test mobile (390px) properly — last session's viewport was stuck at 1512×831 all night, so **nothing mobile was actually verified**. Needs a real device or a normal (non-remote) browser session.
- [ ] Test the free-tier experience for real (Discovery/Applications/Board/Interview-prep) — blocked last time on completing email confirmation on a fresh account.
- [ ] Test account deletion end-to-end — not exercised last review.

## From competitor research → build

- [ ] Add manual/untracked application entries (nullable `vacancy_id` + free-text employer/role/URL/closing-date columns) — closes the "can't track a vacancy Apprentio hasn't indexed" gap. No AI drafting on manual entries in v1.
- [ ] Research step: check whether `vacancies.raw_json` carries a minimum-grade/qualification field before deciding grade-eligibility matching is buildable.
- [ ] Add a free-tier, no-generation-cost CV-to-vacancy match score (plain keyword/requirement overlap, no Anthropic call) as an upgrade nudge.
- [ ] Link out to Higherin's employer review page per vacancy/employer (not a built review system).
- [ ] Link out to free psychometric-test practice (Graduates First etc.) contextually in interview prep, when an employer's test provider is actually documented.
- [ ] **Interview practice with feedback** (bigger effort, own multi-step build): record an audio answer → transcribe → Claude feedback on content/STAR/pacing/filler words. Scoped smaller than competitors' video-analysis versions on purpose.

## Brainstormed ideas (speculative — react before building)

- [ ] Apply-window calendar (when a window is expected to open, not just closing dates) — matches the actual 3-wave application strategy in the seed research.
- [ ] Zero-cost readiness indicator per application (CV uploaded? draft approved? prep engaged with?) — no AI call, derived from existing data.
- [ ] A-level/BTEC-to-standard mapping helper (plain-language translation of a profile against a standard's stated requirements).
- [ ] Optional private reflection note on rejection — no AI, just a text field.
- [ ] "What's changed" digest for saved/watched employers, extending the already-planned Phase 3 reminders.
- [ ] (Later, needs real user volume) anonymized "similar profiles also applied to" signal — same UGC/moderation caution as the review-system decision, not a visible social feature.

## Explicitly decided against (don't re-propose without a new reason)

LinkedIn import, a full skills-assessment matching engine (Multiverse-style), a UGC employer review system, virtual insight-week content, a full career/sector-fit quiz (Prospects-style) — see `OVERNIGHT_COMPETITOR_RESEARCH.md` for the reasoning behind each.
