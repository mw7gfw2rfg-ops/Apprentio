-- The column-level REVOKE in 20260806090921 was a silent no-op: Postgres's
-- table-wide `GRANT UPDATE ON profiles TO authenticated` (from the Phase 0
-- schema setup) apparently isn't correctly narrowed by a later
-- column-specific REVOKE against the same role in this project — verified
-- live: authenticated could still write subscription_tier after that
-- migration ran. The robust fix is the inverse: revoke UPDATE entirely, then
-- explicitly grant it back only on the columns onboarding/profile-editing
-- code actually needs to write. subscription_tier and free_drafts_used are
-- deliberately excluded — only the Stripe webhook and the draft action's
-- admin-client write may ever set them.
REVOKE UPDATE ON public.profiles FROM authenticated;

GRANT UPDATE (
  full_name, school_year, subjects, grades, predicted_grades,
  sectors_of_interest, max_commute_minutes, postcode, right_to_work,
  security_clearance_eligible, base_cv_storage_path,
  base_cover_letter_storage_path, onboarding_complete,
  minimum_apprenticeship_level
) ON public.profiles TO authenticated;

NOTIFY pgrst, 'reload schema';
