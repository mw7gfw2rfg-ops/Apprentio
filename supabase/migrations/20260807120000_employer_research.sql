-- Cached, real (web-search-sourced) employer research, keyed by employer --
-- not by vacancy or user -- so the same research is reused across every
-- vacancy at that employer instead of re-researching per draft. Shared
-- reference data, same pattern as vacancies/employer_sources: readable by
-- any signed-in user, written only by the service role (the drafting
-- action, via createAdminClient), never directly by the authenticated role.
--
-- employer_key is a normalised (lower/trimmed) lookup key so "UNISYS
-- LIMITED" from the FAA sync and any differently-cased curated entry for
-- the same real company resolve to the same cache row. employer_name keeps
-- the original display casing from whichever vacancy first triggered the
-- research.
create table public.employer_research (
  id uuid primary key default gen_random_uuid(),
  employer_key text not null unique,
  employer_name text not null,
  summary text,
  values_culture text,
  notable_facts text,
  source text,
  -- False when a real web search ran but genuinely found nothing usable
  -- about this employer (name too generic/ambiguous, no web presence).
  -- Kept as its own cache row rather than left unresearched, so a student
  -- viewing the vacancy or drafting against it doesn't re-trigger a search
  -- every single time -- but it still expires after 30 days like a normal
  -- hit, in case the employer's web presence improves.
  found boolean not null default true,
  researched_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.employer_research enable row level security;

create policy "employer_research_select_all" on public.employer_research
  for select using (true);
