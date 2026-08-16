-- Audio interview-practice feature: a student records a spoken answer to one
-- of their AI-generated interview-prep questions, gets back a transcript +
-- structured feedback (content/STAR coverage, pacing, filler-word
-- frequency). Deliberately stores only the transcript and derived feedback
-- text, never the audio itself -- the recording is transcribed in-memory
-- inside the server action and discarded, never written to Storage or disk,
-- since these are real minors and this is a new sensitive-data surface
-- (PLAN.md § Data protection). Same RLS shape as `applications`: full
-- ownership scoping, no shared/admin access needed.
create table public.interview_practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  application_id uuid not null references public.applications (id) on delete cascade,
  format text not null,
  question text not null,
  transcript text not null,
  duration_seconds numeric not null,
  words_per_minute numeric not null,
  filler_word_count int not null,
  filler_word_breakdown jsonb not null,
  feedback jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.interview_practice_attempts enable row level security;

create policy "interview_practice_attempts_select_own" on public.interview_practice_attempts
  for select using (auth.uid() = user_id);

create policy "interview_practice_attempts_insert_own" on public.interview_practice_attempts
  for insert with check (auth.uid() = user_id);
