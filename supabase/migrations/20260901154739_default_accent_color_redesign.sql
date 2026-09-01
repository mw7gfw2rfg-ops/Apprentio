-- The UI redesign changed the default accent color from indigo to sage
-- (see src/lib/accent-color.ts DEFAULT_ACCENT_COLOR) and re-targeted what
-- accent_color actually drives (tint/ring, not the primary button fill).
-- Without this migration, every existing row still carrying the old
-- '#4f46e5' column default would stop hitting computeAccentTokens()'s
-- "this is the default, use the exact hardcoded tokens" shortcut and
-- instead get a real computed (and unintended) indigo-derived tint --
-- effectively un-defaulting everyone who never touched Settings.

alter table public.profiles
  alter column accent_color set default '#7fb8a0';

-- Only rows still exactly at the old default are touched -- a user who
-- deliberately picked '#4f46e5' themselves is indistinguishable from this
-- and gets swept along too, same accepted edge case the existing
-- resetAccentColor action already lives with.
update public.profiles
  set accent_color = '#7fb8a0'
  where accent_color = '#4f46e5';
