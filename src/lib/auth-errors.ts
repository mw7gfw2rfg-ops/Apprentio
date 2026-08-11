import type { AuthError } from "@supabase/supabase-js";

// Never show a raw Supabase Auth string to the user (OVERNIGHT_UX_REVIEW.md
// M1) -- `error.code` is the stable, documented identifier Supabase Auth
// actually promises not to silently reword; `error.message` is prose meant
// for logs/developers, not end users, and its wording isn't a contract.
// Reused by all four auth actions (login, signup, forgot-password,
// reset-password) rather than duplicated per page.
const GENERIC_FALLBACK =
  "Something went wrong on our end — please try again in a moment.";

const CODE_MESSAGES: Record<string, string> = {
  invalid_credentials: "That email or password isn't right — check both and try again.",
  email_not_confirmed:
    "Confirm your email first — check your inbox for the link we sent when you signed up.",
  user_banned: "This account has been suspended. Contact support if you think that's wrong.",
  user_not_found: "We couldn't find an account for that email.",

  user_already_exists: "An account already exists for that email — try logging in instead.",
  email_exists: "An account already exists for that email — try logging in instead.",
  identity_already_exists: "An account already exists for that email — try logging in instead.",

  weak_password:
    "Choose a stronger password — at least 8 characters, and avoid very common or simple ones.",
  same_password: "That's your current password — choose a different one.",

  email_address_invalid: "That doesn't look like a valid email address.",
  email_address_not_authorized: "That email address can't be used to sign up right now.",
  signup_disabled: "New sign-ups are temporarily unavailable — please try again later.",

  over_email_send_rate_limit: "Too many attempts — wait a few minutes before trying again.",
  over_request_rate_limit: "Too many attempts — wait a few minutes before trying again.",
  over_sms_send_rate_limit: "Too many attempts — wait a few minutes before trying again.",

  session_expired: "That link has expired — request a new one.",
  session_not_found: "That link has expired or has already been used — request a new one.",
  otp_expired: "That link has expired — request a new one.",
  flow_state_expired: "That link has expired — request a new one.",
  flow_state_not_found: "That link is invalid or has already been used — request a new one.",
  bad_code_verifier: "That link is invalid or has already been used — request a new one.",

  captcha_failed: "We couldn't verify you're not a robot — please try again.",
};

export function friendlyAuthErrorMessage(error: AuthError): string {
  if (error.code && CODE_MESSAGES[error.code]) {
    return CODE_MESSAGES[error.code];
  }
  return GENERIC_FALLBACK;
}
