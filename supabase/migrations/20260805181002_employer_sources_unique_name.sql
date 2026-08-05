-- Allows upserting employer_sources by employer_name from the seed script
alter table public.employer_sources
  add constraint employer_sources_employer_name_key unique (employer_name);
