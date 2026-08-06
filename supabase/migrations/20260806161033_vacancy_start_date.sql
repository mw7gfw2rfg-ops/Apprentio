-- Adds a real start_date column instead of reading raw_json ad hoc every
-- time Discovery needs it. Backfills gov_api rows from raw_json->>'startDate'
-- (confirmed against real synced rows: the FAA API's field is camelCase
-- "startDate", an ISO datetime like "2026-09-01T00:00:00Z" -- ::date truncates
-- it to the calendar date). Curated rows have no raw_json equivalent to
-- backfill from; they stay null until set via the admin form or the
-- add-curated-vacancy script, and Discovery shows an honest
-- "Start date not specified" for those until then.

alter table public.vacancies
  add column start_date date;

update public.vacancies
set start_date = (raw_json ->> 'startDate')::date
where source = 'gov_api'
  and raw_json ->> 'startDate' is not null;
