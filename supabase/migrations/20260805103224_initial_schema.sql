-- Apprentio initial schema (PLAN.md §5 Data model)

create type subscription_tier as enum ('free', 'premium');
create type subscription_status as enum ('active', 'past_due', 'canceled', 'trialing');
create type vacancy_source as enum ('gov_api', 'curated');
create type employer_portal_type as enum ('direct', 'ucas', 'findapprenticeship');
create type application_stage as enum (
  'saved', 'drafting', 'ready_for_review', 'approved',
  'submitted', 'interview', 'offer', 'rejected', 'withdrawn'
);
create type submission_method as enum ('manual', 'portal_assist');

-- profiles: extends auth.users 1:1
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  school_year text,
  subjects text[] not null default '{}',
  grades jsonb not null default '{}',
  predicted_grades jsonb not null default '{}',
  sectors_of_interest text[] not null default '{}',
  max_commute_minutes int,
  postcode text,
  right_to_work boolean,
  security_clearance_eligible boolean,
  base_cv_storage_path text,
  base_cover_letter_storage_path text,
  onboarding_complete boolean not null default false,
  subscription_tier subscription_tier not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- subscriptions: billing state, one active row per user
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status subscription_status,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

-- vacancies: shared reference data, synced from gov.uk API + curated sources
create table public.vacancies (
  id uuid primary key default gen_random_uuid(),
  source vacancy_source not null,
  external_id text,
  employer_name text not null,
  role_title text not null,
  apprenticeship_level int,
  sector text[] not null default '{}',
  standard_reference text,
  location text,
  postcode text,
  closing_date date,
  apply_url text,
  description text,
  raw_json jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source, external_id)
);

-- employer_sources: curated reference data, admin-maintained
create table public.employer_sources (
  id uuid primary key default gen_random_uuid(),
  employer_name text not null,
  portal_url text,
  portal_type employer_portal_type,
  verified_level text,
  notes text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- applications: one per (user, vacancy)
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vacancy_id uuid not null references public.vacancies (id) on delete cascade,
  stage application_stage not null default 'saved',
  drafted_cv text,
  drafted_cover_letter text,
  draft_notes text,
  approved_at timestamptz,
  submitted_at timestamptz,
  submission_method submission_method,
  notes text,
  deadline_reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, vacancy_id)
);

-- application_events: audit trail
create table public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- keep updated_at current on profiles/applications
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.applications
  for each row execute function public.set_updated_at();

-- create a profile row automatically when a new auth user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
-- every table except vacancies and employer_sources (shared reference data) is scoped user_id = auth.uid()

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.vacancies enable row level security;
alter table public.employer_sources enable row level security;
alter table public.applications enable row level security;
alter table public.application_events enable row level security;

-- profiles: owner can read/create/update their own row (deletion is a server-side/service-role flow)
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);

-- subscriptions: read-only to owner; only Stripe webhooks (service role) write
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- vacancies: shared reference data, read-only to all signed-in users
create policy "vacancies_select_all" on public.vacancies
  for select using (true);

-- employer_sources: shared reference data, read-only to all signed-in users
create policy "employer_sources_select_all" on public.employer_sources
  for select using (true);

-- applications: full CRUD scoped to the owning user
create policy "applications_select_own" on public.applications
  for select using (auth.uid() = user_id);
create policy "applications_insert_own" on public.applications
  for insert with check (auth.uid() = user_id);
create policy "applications_update_own" on public.applications
  for update using (auth.uid() = user_id);
create policy "applications_delete_own" on public.applications
  for delete using (auth.uid() = user_id);

-- application_events: read-only to the owner of the parent application; system writes via service role
create policy "application_events_select_own" on public.application_events
  for select using (
    exists (
      select 1 from public.applications
      where applications.id = application_events.application_id
        and applications.user_id = auth.uid()
    )
  );
