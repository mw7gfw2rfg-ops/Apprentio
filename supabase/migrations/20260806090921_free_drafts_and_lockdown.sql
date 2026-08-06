alter table public.profiles
  add column free_drafts_used int not null default 0;

-- subscription_tier and free_drafts_used must only ever be written by
-- trusted server-side code (the Stripe webhook; the draft action's
-- post-authorization admin-client write) — never by the user's own
-- authenticated client. RLS already scopes profiles_update_own to their own
-- row, but that's row-level, not column-level: without this, a signed-in
-- user could PATCH their own profile and grant themselves premium or reset
-- their free-draft count directly via the REST API. Column-level REVOKE
-- closes that gap regardless of what RLS policy exists on the row.
revoke update (subscription_tier, free_drafts_used) on public.profiles from authenticated;
