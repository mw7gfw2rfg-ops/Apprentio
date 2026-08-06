-- Force PostgREST to reload its schema/permissions cache — GRANT/REVOKE
-- changes in the previous migration don't automatically invalidate it.
NOTIFY pgrst, 'reload schema';
