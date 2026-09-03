-- Lets a student register interest in a curated target employer that
-- doesn't have a live vacancy yet (e.g. "Opens Sept 2026" per
-- employer_sources.notes), so the app can eventually notify them once a
-- real vacancy is added for that employer_source_id.
create table public.employer_interest_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  employer_source_id uuid not null references public.employer_sources (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, employer_source_id)
);

alter table public.employer_interest_registrations enable row level security;

create policy "employer_interest_registrations_select_own"
  on public.employer_interest_registrations
  for select using (auth.uid() = user_id);

create policy "employer_interest_registrations_insert_own"
  on public.employer_interest_registrations
  for insert with check (auth.uid() = user_id);

create policy "employer_interest_registrations_delete_own"
  on public.employer_interest_registrations
  for delete using (auth.uid() = user_id);
