-- Basic per-user rate limiting on every path that reaches the Anthropic API
-- (OVERNIGHT_SECURITY_REVIEW.md #2): drafting, interview-prep generation
-- (including Regenerate), and employer research. Premium's "unlimited"
-- promise is about the tier gate, not about having zero technical ceiling --
-- this is defense-in-depth against a scripted loop or a compromised
-- account, independent of Finding 1's free-draft counter.
--
-- Fixed hourly window, not a sliding one: a user could in principle send
-- their whole hour's worth of requests right at a window boundary and
-- another batch two minutes later just after it rolls over. That's an
-- accepted, deliberate trade for simplicity -- the goal here is capping
-- runaway/scripted abuse, not precise fairness, and a real user will never
-- notice the boundary exists.
create table public.ai_rate_limits (
  user_id uuid not null,
  action text not null,
  window_start timestamptz not null,
  request_count int not null default 0,
  primary key (user_id, action, window_start)
);

-- No policies for `authenticated` -- this is internal bookkeeping, not
-- something a client should read or write directly. The only access path
-- is claim_ai_rate_limit below, which (as SECURITY DEFINER) bypasses RLS
-- regardless.
alter table public.ai_rate_limits enable row level security;

-- Single atomic statement, same shape as claim_free_draft: an
-- INSERT ... ON CONFLICT DO UPDATE ... WHERE <under limit> RETURNING.
-- First request in a given hour always inserts (the WHERE only gates the
-- conflict/update branch). Once request_count reaches p_limit, the WHERE
-- clause on the update branch is false, so no row is touched and RETURNING
-- yields nothing -- NULL back in JS means "rate limited", exactly like
-- claim_free_draft's NULL-means-limit-reached contract, so callers can
-- reuse the same handling shape.
create or replace function public.claim_ai_rate_limit(p_action text, p_limit int)
returns int
language sql
security definer
set search_path = public
as $$
  insert into public.ai_rate_limits (user_id, action, window_start, request_count)
  values (auth.uid(), p_action, date_trunc('hour', now()), 1)
  on conflict (user_id, action, window_start)
  do update set request_count = ai_rate_limits.request_count + 1
  where ai_rate_limits.request_count < p_limit
  returning request_count;
$$;

grant execute on function public.claim_ai_rate_limit(text, int) to authenticated;
