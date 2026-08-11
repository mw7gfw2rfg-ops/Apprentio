-- application_events had a read-only policy from day one ("system writes
-- via service role") but nothing ever wrote to it (OVERNIGHT_SECURITY_REVIEW.md
-- #8). Decision: build the audit trail rather than drop the table, since
-- this app's core safety property is "nothing submits without explicit
-- human approval" and it's handling real employer applications for minors.
--
-- Rather than route every lifecycle write through a service-role client
-- (a new elevated-privilege path in files that don't otherwise need one),
-- let the same user-scoped client that already performs the real
-- applications update also insert its own audit row -- same ownership
-- check as the existing select policy, just for insert.
create policy "application_events_insert_own" on public.application_events
  for insert
  with check (
    exists (
      select 1 from public.applications
      where applications.id = application_events.application_id
        and applications.user_id = auth.uid()
    )
  );
