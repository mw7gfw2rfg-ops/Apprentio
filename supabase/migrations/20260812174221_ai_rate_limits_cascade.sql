-- ai_rate_limits.user_id had no foreign key to auth.users, so it wasn't
-- covered by the ON DELETE CASCADE the rest of the schema relies on, and
-- deleteAccount() (src/app/(app)/account/delete/actions.ts) never deleted
-- from it explicitly either -- confirmed live (TODO.md, account-deletion
-- audit) that a real rate-limit row survives full, verified account
-- deletion, permanently orphaned and referencing a user_id that no longer
-- exists anywhere. This affects every user who has ever drafted, run
-- interview-prep, or triggered employer research -- not an edge case --
-- and this is real minors' data under a real deletion promise (PLAN.md §
-- Data protection), so the fix is structural: a foreign key, not an
-- explicit delete call that a future deletion path could just as easily
-- forget to include.

-- Existing orphans from real testing before this fix landed -- the
-- constraint below can't be added while any exist.
delete from public.ai_rate_limits
where user_id not in (select id from auth.users);

alter table public.ai_rate_limits
  add constraint ai_rate_limits_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;
