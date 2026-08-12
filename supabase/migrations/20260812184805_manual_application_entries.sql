-- Every tracked application currently must reference a real vacancies row
-- from the ingested API/curated list. Competitor research flagged this as a
-- real, common gap: students want to track apprenticeships Apprentio hasn't
-- indexed. This adds a manual-entry path alongside the existing
-- vacancy_id-backed flow.

alter table public.applications
  alter column vacancy_id drop not null;

alter table public.applications
  add column manual_employer_name text,
  add column manual_role_title text,
  add column manual_apply_url text,
  add column manual_closing_date date;

-- Every row is either vacancy-backed or has the minimum manual fields
-- needed to render sensibly everywhere applications is displayed (list,
-- board, detail view) -- employer name and role title. apply_url and
-- closing_date stay optional since a manual entry may not have a single
-- clean link (e.g. applied by email) or a known deadline.
alter table public.applications
  add constraint applications_vacancy_or_manual_check
  check (
    vacancy_id is not null
    or (manual_employer_name is not null and manual_role_title is not null)
  );

-- Note: the existing `unique (user_id, vacancy_id)` constraint doesn't
-- dedupe manual entries -- multiple NULLs don't violate a standard SQL
-- unique constraint. That's expected: manual entries have no natural
-- dedup key.
