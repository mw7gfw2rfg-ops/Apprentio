-- Fixes the free-draft-limit race (OVERNIGHT_SECURITY_REVIEW.md #1):
-- draftApplication() used to read free_drafts_used, check it in application
-- code, call Anthropic, then write back profile.free_drafts_used + 1 -- the
-- value captured at read time. Concurrent requests all read the same
-- pre-increment count, all pass the gate, and all call the real Anthropic
-- API before any of the writes land. A single atomic UPDATE ... WHERE ...
-- RETURNING closes that: the row-level check and the increment happen in
-- one statement, so concurrent callers serialise on the same row and only
-- as many as remain under the limit can ever succeed.
--
-- SECURITY DEFINER + auth.uid() (not a passed-in user_id parameter) so this
-- is safe to expose to the authenticated role directly -- a caller can only
-- ever claim/release their own row, there's no way to target another
-- user's counter regardless of what's passed in.
create or replace function public.claim_free_draft(p_limit int)
returns int
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set free_drafts_used = free_drafts_used + 1
  where user_id = auth.uid()
    and free_drafts_used < p_limit
  returning free_drafts_used;
$$;

-- Rollback path for when the claim succeeded but the draft itself then
-- failed (Anthropic call errored, or the result couldn't be saved) -- also
-- a single atomic statement, not read-then-write, so it can't itself race
-- against another concurrent claim/release on the same row. Clamped at 0
-- as a defensive floor; it should never go negative in practice since a
-- release only ever follows a successful claim.
create or replace function public.release_free_draft()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set free_drafts_used = greatest(free_drafts_used - 1, 0)
  where user_id = auth.uid();
$$;

grant execute on function public.claim_free_draft(int) to authenticated;
grant execute on function public.release_free_draft() to authenticated;
