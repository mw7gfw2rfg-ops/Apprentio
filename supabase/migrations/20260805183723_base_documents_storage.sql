-- Private bucket for base CV / cover letter uploads. Files live at
-- {user_id}/cv.<ext> and {user_id}/cover-letter.<ext>; RLS below scopes
-- access to the owning user via that path prefix.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'base-documents',
  'base-documents',
  false,
  5242880, -- 5MB
  array['application/pdf', 'text/plain']
)
on conflict (id) do nothing;

-- storage.objects ships with RLS already enabled by Supabase; the migration
-- role doesn't own that table so it can't re-issue ALTER TABLE ... ENABLE RLS.

create policy "base_documents_select_own" on storage.objects
  for select using (
    bucket_id = 'base-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "base_documents_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'base-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "base_documents_update_own" on storage.objects
  for update using (
    bucket_id = 'base-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "base_documents_delete_own" on storage.objects
  for delete using (
    bucket_id = 'base-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
