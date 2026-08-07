# Apprentio — Overnight Implementation Plan (from competitor gap analysis)

**Status:** Plan only, not committed to git, nothing implemented. Written 2026-08-07 by Atlas, synthesizing `OVERNIGHT_COMPETITOR_RESEARCH.md` against `PLAN.md`. Needs Archie's sign-off before any of this becomes a real prompt to build.

This extends PLAN.md's existing roadmap rather than replacing it — Phase 0-2 are done, and the design-system work (UI passes, logo, kanban reduction, Indeed-style Discovery, employer research, interview prep) happened in between what PLAN.md called Phase 2 and Phase 3. What follows picks up from there.

---

## Phase 3 — Close the two real gaps

Both of these are things Apprentio's own PLAN.md already implicitly admits are missing (§10 Risks: vacancy coverage gaps) or a genuine differentiator competitors have that fits the product's actual strengths (grounded AI content) rather than a "they have it so we must" copy.

### 3a. Manual/untracked application entries
**The gap:** `applications` is `(user_id, vacancy_id)` — every tracked application must already exist in Apprentio's own `vacancies` table. When a student finds an apprenticeship Apprentio hasn't indexed (very likely for employers outside the curated list, or anything posted directly rather than via the gov API), there's currently no way to track it at all. This undermines "track every application in one board."

**Proposed shape:** make `vacancy_id` nullable on `applications`, add free-text columns for the manual case (`manual_employer_name`, `manual_role_title`, `manual_apply_url`, `manual_closing_date`) populated only when `vacancy_id` is null. Board, card rendering, and every downstream flow (draft/approve/submit/status) need to handle both cases — a manual entry has no `vacancy.description`/`raw_json` to draft from, so drafting either needs the student to paste in a description, or manual entries simply don't get AI drafting (student writes their own, still tracks the application). Recommend the latter for v1 — simpler, and matches "we don't have data on this one" honestly rather than drafting from nothing.

**Why this order:** cheap relative to value (one nullable FK + a few text columns, not a new subsystem), and it's the single strongest finding in the research.

### 3b. Verify grade-eligibility data before building anything
**Not a build task yet — a research/verification task first.** UCAS's 2026 formalisation of Level 3 tariff points raises a real question: does `vacancies.raw_json` (from the Find an Apprenticeship API) actually carry a minimum-grade/qualification-requirement field? PLAN.md's matching logic (§6) filters by sector, level, commute, and closing date, but not academic eligibility — meaning a "matched" vacancy could be one the student doesn't actually qualify for, which is worse than no match for a product this careful about not misleading users.

**Next step:** have the Apprentio session check what's actually in `raw_json` for a sample of real vacancies before deciding whether this is buildable. Don't assume the field exists.

---

## Phase 4 — Interview practice with feedback

The most substantively new feature idea from the research, not a copy of a competitor UI: employers already using one-way video-interview formats (HireVue etc.) reward *practice with feedback*, and Apprentio's current interview prep is explanatory content only. This is a real capability gap, not a polish item.

**Scoped smaller than competitors' full video-analysis versions, on purpose:** Voomer/Intervyo do webcam video + tone/body-language analysis — that's a much bigger technical lift (computer vision) for uncertain marginal value over a cheaper version. Recommend starting with **audio recording → transcription → Claude feedback on content, structure (STAR), pacing, and filler words** from the transcript + timing data, not full video analysis. Captures most of the real value (did you actually answer the question, did you ramble, did you use STAR) without the CV/ML complexity.

- Student picks a generated question (reusing the existing premium AI-question generation from interview prep)
- Records an audio answer in-browser (needs a recording UI + audio upload to Storage, similar pattern to CV/CL upload)
- Transcribe (Whisper or similar — needs a provider decision, flag as an open question)
- Claude critiques the transcript against the question + STAR structure + the vacancy/employer context already available
- Premium-gated, same cost-control pattern as drafting

This is a bigger build than anything else on this list — treat it as its own multi-step Phase 4 effort (transcription provider research → recording UI → feedback generation → verification), not a single prompt.

---

## Phase 3 (parallel, cheap) — Free-tier taste + contextual link-outs

These don't depend on anything above and are individually small:

- **Free ATS-style match score.** A no-generation-cost (no Anthropic call — plain keyword/requirement overlap) "how well does your CV match this vacancy" score or short checklist, shown to free-tier users. Gives a concrete, personalised upgrade reason without touching the free-draft-limit cost logic. Keep it understated — a percentage or short list, not a gamified badge.
- **Link out to Higherin (formerly RateMyApprenticeship) employer reviews** from each vacancy/employer detail page. Not a review system — a single contextual outbound link, near-zero build cost, closes a real "what's it actually like there" gap without taking on UGC/moderation liability for a minors' product.
- **Link out to free psychometric test practice** (Graduates First, etc.) contextually inside interview prep's "Online tests" format, when an employer's known test provider is documented in `employer_sources`. Don't rebuild a test bank that's already free and well-known to careers services.

---

## Deferred — only build if there's a real signal, not proactively

- **Sector-fit nudge** for students who haven't decided a sector — not a full quiz (out of positioning, that's Prospects'/UCAS's job). Only worth a two-question nudge if V1 onboarding data actually shows sector-uncertainty causing drop-off. Don't build ahead of evidence.
- **"For parents" trust content** — bundle into the still-pending privacy policy/legal-review work (PLAN.md §8), not a separate product feature.

## Explicitly not building
LinkedIn import, a full skills-assessment matching engine (Multiverse-style), a UGC employer review system, virtual insight-week content. All noted in the research with reasoning — scope/audience/positioning mismatches, not missed opportunities.

---

## Suggested build order
1. 3a (manual entries) — cheap, closes an acknowledged real gap
2. 3b (grade-eligibility research, then build only if the data supports it)
3. Free ATS score + the two link-outs — all cheap, can go in any order, good "quick wins" batch
4. Phase 4 (interview practice with feedback) — biggest effort, do once the above is settled and stable

Nothing here should be prompted to the Apprentio session without Archie reviewing this plan first.
