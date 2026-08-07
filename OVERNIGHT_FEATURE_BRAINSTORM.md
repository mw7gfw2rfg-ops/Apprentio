# Apprentio — Feature Brainstorm (Overnight)

**Status:** Speculative ideation, not researched/validated like the competitor gap list, not committed to git. Written 2026-08-07 by Atlas. These are ideas worth a reaction from Archie, not a plan — none of this should be built without discussion first.

Deliberately not repeating anything from `OVERNIGHT_COMPETITOR_RESEARCH.md` or `OVERNIGHT_IMPLEMENTATION_PLAN.md` — these are net-new ideas that came from thinking about what's specific to Apprentio's actual niche (UK degree apprenticeships specifically, application *timing* strategy, a multi-wave application season) rather than what a general job tracker does.

---

### 1. Apply-window calendar, not just a closing-date list
Archie's own seed research (`FILTERED-EMPLOYER-LIST.md`) is built entirely around a 3-wave strategy — Wave 1 (Gov/Defence, Sept-Nov), Wave 2 (Consulting/Tech, Nov-Feb), Wave 3 (Financial Services, Feb-May) — and the explicit advice to "apply on day one" for high-priority employers like GCHQ. Right now Discovery/the board show closing dates, but nothing shows *when a window is expected to open* for employers that haven't posted yet. A simple calendar or timeline view — pulling from `employer_sources` expected-open data where known — would directly support the actual strategy Apprentio's own seed data was built around, not a generic "upcoming deadlines" widget.

### 2. A real (non-AI) readiness indicator per application
A small, honest, zero-cost signal per application card: base CV uploaded? draft approved? interview prep engaged with for this specific format? (grade-eligibility met, once/if 3b above exists?) Derived entirely from state already in the database — no Anthropic call, no new infrastructure — but gives a tangible "how ready am I really" view that's currently implicit and scattered across different pages.

### 3. A-level/BTEC-to-standard mapping helper
Apprenticeship "standards" (e.g. ST0409 for cyber) list specific desired subjects/skills. A small feature that translates a student's actual profile ("Product Design, Maths, CS, Psychology") into plain language about how that maps to a given standard's stated requirements — reusing profile data already collected, no new external dependency, and genuinely different from anything a generic job tracker would offer since it's specific to how UK apprenticeship standards are written.

### 4. Optional reflection note on rejection
When a card moves to `rejected`, an optional, lightweight prompt: "anything you'd do differently next time?" — stored as a private note on that application. Costs nothing (a text field, no AI), but given the real multi-wave season structure (a Wave 1 rejection should inform a Wave 2 application), this is a small nudge toward actually learning across a season rather than each application being an isolated event. Skippable, never required.

### 5. A "what's changed" digest for saved/watched employers
Extends the already-planned Phase 3 deadline reminders (PLAN.md) slightly: since vacancy sync runs nightly and `employer_sources` gets updated (portal URLs, verification status), a periodic digest of concrete changes for employers/vacancies the student has actually saved or applied to — not a generic "here's what's new" blast, specific to what they're already tracking.

### 6. Anonymous aggregate signal, once there's real user volume
**Not** a social/UGC feature (the competitor research specifically flagged UGC/moderation risk as a reason to avoid a review system for a minors' product, and this should carry the same caution) — but once Apprentio has enough real users, something like "students with a similar profile to yours also applied to..." as a quiet, anonymized ranking signal in Discovery, not a visible social feature. Explicitly a later-stage idea — needs real scale to mean anything, and needs careful thought about what's actually being aggregated/shown before it's remotely close to buildable. Flagging now only so it's on the radar, not because it's actionable soon.

---

None of these are validated the way the competitor research is — they're pattern-matches on what makes Apprentio's specific situation (UK degree apprenticeships, a real multi-wave strategy, minors' data) different from a generic tracker. Worth a reaction, not a commitment.
