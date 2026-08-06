-- User-customizable accent color. Defaults to the indigo already used
-- throughout the app, so nobody's experience changes until they opt in via
-- /account/settings. Validated at three layers, matching this project's
-- existing pattern for user-editable fields: the native color input can
-- only ever produce a valid #rrggbb, the server action re-validates before
-- writing, and this CHECK constraint is the final backstop.
alter table public.profiles
  add column accent_color text not null default '#4f46e5'
    check (accent_color ~ '^#[0-9a-fA-F]{6}$');

-- Additive grant on top of the existing profiles column allow-list
-- (20260806091337_fix_profiles_column_lockdown.sql) -- accent_color is a
-- genuine user preference, not a trust-boundary field like
-- subscription_tier, so the user's own authenticated client may write it
-- directly.
GRANT UPDATE (accent_color) ON public.profiles TO authenticated;

NOTIFY pgrst, 'reload schema';
