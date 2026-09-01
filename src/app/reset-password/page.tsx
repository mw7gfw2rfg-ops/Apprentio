import { redirect } from "next/navigation";
import { AuthCard, AuthBanner } from "@/components/auth-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { resetPassword } from "../login/actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only reachable with the recovery session /auth/callback established
  // from a real reset-link click -- anyone landing here without one (an
  // expired/already-used link, or just typing the URL) gets sent back to
  // request a fresh link instead of a broken form.
  if (!user) {
    redirect(
      "/forgot-password?error=" +
        encodeURIComponent("That reset link is invalid or has expired — request a new one.")
    );
  }

  return (
    <AuthCard title="Set a new password" subtitle={`Choose a new password for ${user.email}.`}>
      {error && <AuthBanner tone="error">{error}</AuthBanner>}

      <form className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            aria-describedby="password-hint"
            className="h-11 rounded-2xl px-4 text-base"
          />
          <span id="password-hint" className="text-xs text-muted-foreground/70">
            At least 8 characters.
          </span>
        </div>
        <Button formAction={resetPassword} size="lg" className="mt-2">
          Update password
        </Button>
      </form>
    </AuthCard>
  );
}
