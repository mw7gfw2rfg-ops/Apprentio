-- Write-through cache for the plain-text extraction of a student's base CV
-- PDF/txt file. Downloading + parsing the PDF is the expensive part of the
-- free-tier CV-to-vacancy match score (Discovery/vacancy detail run this
-- for every vacancy a free-tier user sees), so it's computed once and
-- reused until the underlying file changes -- invalidated explicitly by
-- documents-actions.ts nulling this column in the same update whenever a
-- new CV is uploaded (base_cv_storage_path itself doesn't change on
-- re-upload, it's a stable per-user path with upsert:true, so the path
-- alone can't be used to detect staleness).

alter table public.profiles
  add column base_cv_extracted_text text;
