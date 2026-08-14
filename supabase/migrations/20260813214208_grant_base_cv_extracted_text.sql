-- profiles.base_cv_extracted_text (added in 20260813194853) was never added
-- to the column-level UPDATE allow-list from 20260806091337 -- confirmed
-- live: a real authenticated user hit "permission denied for table
-- profiles" (42501) the moment either uploadBaseDocuments (nulling this
-- column on CV re-upload) or the match-score cache write-back
-- (getBaseCvText) tried to set it, since authenticated has no table-wide
-- UPDATE on profiles, only the explicit per-column grant. Same pattern as
-- 20260806173916_profile_accent_color.sql.
GRANT UPDATE (base_cv_extracted_text) ON public.profiles TO authenticated;

NOTIFY pgrst, 'reload schema';
