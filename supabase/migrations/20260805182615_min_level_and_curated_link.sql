-- Student's minimum acceptable apprenticeship level, captured at onboarding.
-- Nullable: existing profiles predate this field and Discovery must not treat
-- "not yet answered" as a fabricated level.
alter table public.profiles
  add column minimum_apprenticeship_level int
    check (minimum_apprenticeship_level between 2 and 7);

-- Links a manually-curated vacancy back to its employer_sources row.
-- Nullable: gov_api-sourced vacancies have no curated employer link.
alter table public.vacancies
  add column employer_source_id uuid references public.employer_sources (id);
