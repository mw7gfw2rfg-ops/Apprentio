// Single hardcoded admin account — not a role system. Not needed at this
// scale (one operator, dogfooding), per explicit instruction.
const ADMIN_EMAIL = "archie.test+phase0@apprentio.local";

export function isAdminEmail(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL;
}
