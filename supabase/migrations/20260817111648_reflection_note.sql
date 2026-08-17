-- Optional, private reflection note a student can leave on a rejected
-- application -- no AI involved, just plain text. No new RLS needed: the
-- existing applications_select_own/applications_update_own policies
-- (initial schema) already scope this column to its owner like every other
-- column on the table.
alter table public.applications
  add column reflection_note text;
