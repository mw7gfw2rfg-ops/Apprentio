# Apprentio — Competitor Research (Overnight)

**Status:** Research only, not committed to git. Compiled 2026-08-07 by the Careers agent.
**Method:** Read `CLAUDE.md` + `PLAN.md` for what Apprentio already has, then web-searched each competitor. Every claim below is sourced; low-confidence claims are flagged as such rather than stated as fact.

**What Apprentio already has (so these aren't repeated as "gaps" below):** profile-matched vacancy discovery (gov API + curated employer list), AI-drafted CV/cover letter grounded in real employer research (premium), kanban application tracker with deadline reminders, interview prep (free explainers for online tests/video interviews/assessment centres/panel interviews + premium AI-likely-questions + a distinct security-vetting explainer), free/premium split, mandatory human-approval gate before submission.

---

## 1. Direct competitors (UK degree-apprenticeship-specific)

### RateMyApprenticeship (rebranded **Higherin**, 2026)
- **Employer reviews** — 16,000–48,000+ reviews written by real apprentices about specific employers, peer-to-peer ("TripAdvisor for school/college leavers"). [ZoomInfo](https://www.zoominfo.com/c/ratemyapprenticeship/446954546), [Higherin](https://higherin.com/company-profile/4043/ratemyapprenticeship)
- **Personalised hub** — saved jobs, application tracking, deadline reminders, saved searches, all migrated intact from RMA to Higherin. [Higherin](https://higherin.com/ratemyplacement-and-ratemyapprenticeship-have-rebranded-to-higherin)
- **Virtual insight weeks / work experience** — free virtual programmes with specific employers (e.g. a 5-day BDO insight week: company presentations, personal branding, wellbeing workshop, networking). [RateMyApprenticeship](https://www.ratemyapprenticeship.co.uk/apprenticeship-review/65673/bdo/year-12-virtual-insight-week), [Forage listing](https://www.theforage.com/virtual-internships/prototype/7Rb7m3mmcv5QtLqd3/Work%20Ready%20Virtual%20Experience)

**Judgment:** The reviews are RMA's real moat and a genuine gap — a sixth-former choosing between two offers has no way inside Apprentio to know "what's it actually like at KPMG vs EY." But building and moderating a UGC review platform is a large scope departure from a "restrained, premium" positioning and turns Apprentio into a community/UGC product with real moderation liability (reviews about named employers, written by minors). **Don't build a review system.** Cheaper and on-brand: surface a link to the relevant RMA/Higherin review page from each vacancy card in the discovery feed ("see what apprentices say about this employer ↗"), same spirit as your matching, not a new subsystem.

The tracker/reminders overlap almost exactly with what Apprentio already has — not a gap, just confirms the baseline is right.

Virtual insight weeks: genuinely useful for a student unsure if a sector/employer suits them, but it's content curation and employer partnerships, not a feature to engineer. Low priority; if anything, a simple "employer resources" link list per employer in `employer_sources` (insight days, open days) would capture most of the value at near-zero build cost.

### UCAS Apprenticeships
- New dedicated apprenticeships service, launched amid record demand. [UCAS](https://www.ucas.com/corporate/news-and-key-documents/news/ucas-launches-new-apprenticeships-service-demand-hits-all-time-high)
- **From the 2026 cycle, UCAS introduced formal tariff points for Level 3 apprenticeships** (and SCQF Level 6 in Scotland) — a standardised way to compare entry requirements against a student's grades. [associationoflearning.com](https://associationoflearning.com/blog/everything-you-need-to-know-about-ucas-points/)

**Judgment:** This one is worth taking seriously, not for the UCAS brand but for the underlying idea. Apprentio's `profiles` table stores `grades`/`predicted_grades` and PLAN.md's matching logic (§6 Discovery) filters by sector overlap, level, commute, and closing date — but doesn't mention filtering by whether the student's grades actually meet a vacancy's entry requirement. That's a real gap distinct from any competitor's UI: without it, "matched" vacancies could include ones the student isn't academically eligible for, which is a worse experience than no match at all for a premium-feeling product. Recommend flagging to Archie as a matching-logic question (does `vacancies.raw_json` from the gov API carry a minimum-grade/qualification field to match against?), not a UI feature to copy from UCAS.

### findapprenticeship.service.gov.uk (the API Apprentio already ingests)
- Requires **GOV.UK One Login**; once signed in, students can manage applications. [gov.uk](https://www.gov.uk/sign-in-apprenticeship-service-account)
- Separately, **"My Apprenticeship"** (web + app, Google Play/App Store) tracks progress *after* you've started an apprenticeship, not during the application phase. [help.apprenticeships.education.gov.uk](https://help.apprenticeships.education.gov.uk/hc/en-gb/articles/13889971590290-Create-your-GOV-UK-One-Login-)

**Judgment:** Not a real competitor for the application-tracking use case — its own tracking tool is for people who've *already* started, a different lifecycle stage. No action needed; it's a data source, not a rival product.

### Multiverse
- A training-provider-cum-apprenticeship-platform, not a pure discovery tool, but applicants go through a **Skill Scan assessment** before being matched to a programme, and matching for entry-level roles is now open to all ages, not just school leavers. [Multiverse Help Center](https://support.multiverse.io/en/collections/126905-applying-for-an-apprenticeship), [Multiverse blog](https://www.multiverse.io/blog/opening-apprenticeships-to-people-of-all-ages)

**Judgment:** The interesting bit isn't the platform, it's the *matching method* — a short skills assessment rather than only self-reported subjects/grades/sector, which should produce a tighter match than Apprentio's current profile-only filters. Worth keeping in mind as a v2 idea for improving match quality (a 5-minute "which of these are you actually good at" check), but it's a genuine build effort — do not treat as MVP scope. Flagging as a future idea, not a current gap to close.

### Prospects.ac.uk
- **Job Match quiz / Career Planner** — matches personality/interests to job families across 400+ profiles, for students who don't yet know what sector they want. [Prospects](https://www.prospects.ac.uk/job-match), [Prospects Career Planner](https://www.prospects.ac.uk/planner)

**Judgment:** Apprentio's profile assumes the student already knows their `sectors_of_interest` — true for Archie (cyber-only, dogfooding user) but PLAN.md's own §11 Open Questions flags that V1 exposes *all* sectors, meaning some V1 users genuinely won't have decided yet. A full career-matching quiz is out of scope and dilutes the "degree-apprenticeship specialist" positioning into generic careers-guidance territory (Prospects', UCAS's, and the school careers service's job, not Apprentio's). If sector-uncertainty turns out to be a real onboarding drop-off point post-launch, the fix is a two-question nudge ("not sure? these sectors commonly suit [A-level subjects]"), not a quiz engine. Low priority, don't build proactively.

### AllAboutSchoolLeavers / Not Going To Uni
- Both are job boards + advice content (CVs, cover letters, interview tips) + light community content (podcast, blog, employer profiles). [AllAboutSchoolLeavers](https://www.allaboutschoolleavers.co.uk/jobs/school-leaver-programmes), [Not Going To Uni](https://notgoingtouni.co.uk/opportunities)
- Not Going To Uni has **parent-facing content** as a distinct section.

**Judgment:** Nothing here Apprentio is missing structurally — these are content/marketing plays (advice articles, podcasts) rather than product features, and duplicating them would be scope creep for an app that's meant to stay a tool, not a media site. The one idea worth a beat of thought: since users are minors and parents are often involved in decisions (funding, commute, whether to trust a subscription app with their child's data), a short "for parents" explainer page could build trust ahead of Phase 2 public signup — but this is a marketing/trust page, not a feature, and should sit alongside the privacy policy/ToS work already flagged in PLAN.md §8, not be treated as a new product surface.

---

## 2. Adjacent competitors (general job-tracking / AI CV tools)

### Teal, Huntr, Simplify (job tracker + autofill browser extensions)
- All three offer **one-click autofill across ATS portals** (Workday, Greenhouse, iCIMS, Taleo, Lever, SmartRecruiters etc. — Simplify claims 100+). [Simplify](https://simplify.jobs/copilot), [Huntr](https://huntr.co/product/job-application-autofill), [Teal](https://www.tealhq.com/tools/autofill-job-applications)
- **Huntr specifically**: a browser extension that clips *any* job listing from *any* site (not just its own indexed board) straight into the user's tracker, plus map views, contact tracking, progress sharing with mentors/advisors. [Huntr](https://huntr.co/)
- All three keep autofill "reviewable and editable before submission" — not true auto-submit. [jobcopilot.com Teal review](https://jobcopilot.com/teal-review/)
- Simplify's core tracker + autofill is free forever; heavier AI (unlimited tailoring) is paywalled. [LoopCV](https://www.loopcv.pro/directory/simplify/)

**Judgment — two different findings here:**

1. **Autofill itself**: PLAN.md already scopes this correctly as Phase 4, opt-in, per-employer, Playwright-based, premium-only — narrower than the generic tools but appropriate, since Apprentio's users apply to a small set of known major employers (GCHQ, banks, Big 4) rather than hundreds of random ATSs. This research *validates* the existing roadmap decision rather than surfacing a new gap. No change recommended.

2. **Manual/external vacancy tracking (Huntr's "clip anything")** — this is a genuine, currently-unaddressed gap and a good one to flag strongly. Apprentio's `applications` table is `(user_id, vacancy_id)` — every tracked application must map to a row already in Apprentio's own `vacancies` table, which is sourced only from the gov API + curated `employer_sources`. PLAN.md's own §10 Risks admits vacancy coverage is incomplete ("GCHQ often posts directly," curated list needs manual re-verification). So when a student finds an apprenticeship Apprentio hasn't indexed yet — which will happen often, especially for employers outside the curated list — there is currently no way to track that application inside Apprentio at all. That undermines the core promise ("track every application in one board"). Worth raising as a real product question: should `applications` support a manual/free-text entry (employer name, role, URL, deadline typed in directly, no `vacancy_id` FK) so the tracker stays the single source of truth even where discovery has gaps? This is low-build-cost (a nullable `vacancy_id` + a few free-text columns) and directly closes an acknowledged risk in your own plan — this is the strongest single recommendation in this document.

### Careerflow
- Free AI resume builder, LinkedIn optimiser (scores your profile, suggests headline/about/keywords), job tracker, **and a webcam-based mock interview tool with AI feedback on tone, body language, and pacing**, all bundled free-ish for students. [Careerflow for Students](https://www.careerflow.ai/for-students), [Careerflow Features](https://www.careerflow.ai/features)

### HireVue-practice tools (Voomer, Intervyo, JobTestPrep's AI interview prep, Final Round AI)
- These simulate the actual one-way video-interview format employers use (HireVue etc.), record the student's answer, and give AI-scored feedback on tone, pacing, filler words, and content — not just "what to expect" content. Intervyo even offers firm-specific question banks sourced from past candidates at named employers (Goldman, JPM, Deloitte, Bain). [Voomer](https://www.tryvoomer.com/hirevue-practice), [Intervyo](https://www.intervyo.co.uk/features/hirevue), [JobTestPrep](https://www.jobtestprep.com/pre-recorded-interview-prep)

**Judgment:** This is the most substantively different feature type Apprentio is missing in its interview-prep area. Apprentio's current interview prep (per the task brief) is explicitly *passive content* — free format explainers plus premium AI-generated likely questions. None of that is *practice with feedback*. Given that major degree-apprenticeship employers (banks, Big 4, GCHQ/Civil Service) increasingly use exactly this one-way video format as an early screening stage, a "record yourself answering, get feedback on delivery" feature would be more genuinely useful than another explainer page, and it fits the premium-feeling positioning well (it's a natural premium unlock, complements the existing security-vetting and likely-questions features rather than duplicating them). This is worth serious consideration as a Phase 3+ feature — flagging to Archie as a strong, on-brand idea rather than a "competitors have it so we must," because the underlying rationale (this is the actual test format, and Apprentio already does grounded AI content well) holds up independently.

### Practice aptitude/psychometric test sites (JobTestPrep, Graduates First, practiceaptitudetests.com)
- Actual timed practice test *banks* replicating real assessment formats (SHL, Cubiks, etc.) used by employer ATSs — numerical, verbal, situational judgement, personality. Graduates First's core offering is free. [Graduates First](https://www.graduatesfirst.com/), [JobTestPrep](https://www.jobtestprep.co.uk/apprentice-aptitude)

**Judgment:** Apprentio's "online tests" interview-prep item is currently an explainer (what to expect), not a practice test bank. This is a real gap in kind, but **not worth building** — a proper timed test bank replicating SHL/Cubiks formats is a large, narrow-margin build, and strong free alternatives already exist and are well known to careers services (Graduates First is literally free and widely recommended by university careers teams). The better move, fully in keeping with "restrained, not a generic job board": when a vacancy's employer is known to use a specific test provider (this is exactly the kind of fact your grounded employer research would surface), link out to the relevant free practice resource contextually inside the interview-prep flow, rather than rebuilding what Graduates First already does for free. Cheap, genuinely useful, doesn't bloat scope.

### Kickresume, Rezi (AI CV/cover letter builders)
- **ATS keyword-match scoring** — a numeric/percentage score plus a list of missing keywords when a CV is checked against a specific job description, offered as a lighter-weight, often free/near-free action distinct from a full rewrite. [Rezi](https://www.rezi.ai/posts/best-ai-resume-builders), [Kickresume](https://www.kickresume.com/en/ai-resume-writer/)
- **LinkedIn profile import** to prefill CV data. [Kickresume](https://www.kickresume.com/en/)

**Judgment on ATS scoring:** Genuinely worth considering as a *free-tier* feature — right now Apprentio's free tier gets full discovery/tracking but zero taste of the AI drafting value, and the premium upsell button is binary (locked feature vs. unlocked). A lightweight, cheap-to-compute "how well does your base CV match this vacancy" score (keyword overlap, no generation call, so no Anthropic cost) would give free users a concrete, personalised reason to upgrade without touching the cost-control logic in PLAN.md §7. Keep it understated — a plain percentage or short checklist, not a gamified badge/animation, to stay consistent with the restrained design language. Worth raising as an idea, not urgent.

**Judgment on LinkedIn import:** Skip. Most 16-18 year olds don't have a developed LinkedIn profile, and Apprentio's onboarding already collects the structured data (subjects, grades, sector) directly and more reliably than scraping a sparse LinkedIn profile would. Low value for this specific audience.

---

## 3. Summary — ranked by "worth acting on"

| Priority | Finding | Recommendation |
|---|---|---|
| **High** | No way to track an application for a vacancy Apprentio hasn't indexed (Huntr does this; Apprentio's own risk log admits coverage gaps) | Raise as a product question: allow manual/free-text application entries not tied to a `vacancy_id` |
| **High** | Interview prep is passive content only; real employers use one-way video-interview formats (HireVue etc.) that reward *practice with feedback* (Voomer/Intervyo/Careerflow all do this) | Consider a Phase 3+ "record and get AI feedback" practice feature — genuinely differentiated, on-brand for premium |
| **Medium** | Matching doesn't appear to check grade/qualification eligibility against a vacancy's requirements (UCAS now formalises this with Level 3 tariff points) | Ask Archie whether `vacancies.raw_json` carries a minimum-grade field the matcher should use |
| **Medium** | No lightweight free-tier taste of AI value (Rezi/Kickresume's free ATS-score pattern) | Consider a no-generation-cost "match score vs this vacancy" as a free-tier upsell nudge |
| **Low** | No employer reviews/social proof (RateMyApprenticeship's core differentiator) | Don't build a review system (scope + moderation risk); consider linking out to Higherin's review page per employer instead |
| **Low** | No links to free psychometric-test practice resources (Graduates First, JobTestPrep) | Contextual link-out inside interview prep when an employer's test provider is known, not a built test bank |
| **Low** | No career/sector-fit quiz for undecided students (Prospects Job Match) | Skip for now — out of positioning; revisit only if V1 onboarding data shows real sector-uncertainty drop-off |
| **Skip** | LinkedIn import (Kickresume), full skills-assessment matching (Multiverse), parent-facing content (Not Going To Uni), virtual insight-week content (RateMyApprenticeship) | Not worth building for this audience/stage — noted for completeness only |

Nothing above should be built without Archie's sign-off — this file is research, not a spec. The manual-application-tracking gap and the interview-practice-with-feedback gap are the two I'd bring to him first; both are cheap relative to value and neither conflicts with any existing PLAN.md decision.

---

## Sources

- [RateMyApprenticeship / Higherin company profile](https://www.zoominfo.com/c/ratemyapprenticeship/446954546)
- [RateMyPlacement and RateMyApprenticeship rebrand to Higherin](https://higherin.com/ratemyplacement-and-ratemyapprenticeship-have-rebranded-to-higherin)
- [RateMyApprenticeship BDO virtual insight week review](https://www.ratemyapprenticeship.co.uk/apprenticeship-review/65673/bdo/year-12-virtual-insight-week)
- [Work Ready Virtual Experience (Forage listing)](https://www.theforage.com/virtual-internships/prototype/7Rb7m3mmcv5QtLqd3/Work%20Ready%20Virtual%20Experience)
- [UCAS launches new apprenticeships service](https://www.ucas.com/corporate/news-and-key-documents/news/ucas-launches-new-apprenticeships-service-demand-hits-all-time-high)
- [UCAS Points Explained: 2026 Tariff Guide](https://associationoflearning.com/blog/everything-you-need-to-know-about-ucas-points/)
- [Sign in to your apprenticeship service account (GOV.UK)](https://www.gov.uk/sign-in-apprenticeship-service-account)
- [Create your GOV.UK One Login (My Apprenticeship)](https://help.apprenticeships.education.gov.uk/hc/en-gb/articles/13889971590290-Create-your-GOV-UK-One-Login-)
- [Multiverse: Applying for an Apprenticeship](https://support.multiverse.io/en/collections/126905-applying-for-an-apprenticeship)
- [Multiverse: opening apprenticeships to people of all ages](https://www.multiverse.io/blog/opening-apprenticeships-to-people-of-all-ages)
- [Prospects Job Match quiz](https://www.prospects.ac.uk/job-match)
- [Prospects Career Planner](https://www.prospects.ac.uk/planner)
- [AllAboutSchoolLeavers programme finder](https://www.allaboutschoolleavers.co.uk/jobs/school-leaver-programmes)
- [Not Going To Uni opportunities board](https://notgoingtouni.co.uk/opportunities)
- [Teal autofill](https://www.tealhq.com/tools/autofill-job-applications), [Teal review](https://jobcopilot.com/teal-review/)
- [Huntr autofill](https://huntr.co/product/job-application-autofill), [Huntr overview](https://huntr.co/)
- [Simplify Copilot](https://simplify.jobs/copilot), [Simplify Jobs review — LoopCV](https://www.loopcv.pro/directory/simplify/)
- [Careerflow for Students](https://www.careerflow.ai/for-students), [Careerflow Features](https://www.careerflow.ai/features)
- [Voomer HireVue practice](https://www.tryvoomer.com/hirevue-practice)
- [Intervyo HireVue practice](https://www.intervyo.co.uk/features/hirevue)
- [JobTestPrep AI interview prep](https://www.jobtestprep.com/pre-recorded-interview-prep)
- [Graduates First](https://www.graduatesfirst.com/)
- [JobTestPrep apprenticeship aptitude tests](https://www.jobtestprep.co.uk/apprentice-aptitude)
- [Rezi: best AI resume builders 2026](https://www.rezi.ai/posts/best-ai-resume-builders)
- [Kickresume AI resume writer](https://www.kickresume.com/en/ai-resume-writer/)
