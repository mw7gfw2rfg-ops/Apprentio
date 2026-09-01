import Link from "next/link";
import { AuthCard, AuthBanner } from "@/components/auth-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signup } from "../login/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; checkEmail?: string }>;
}) {
  const { error, checkEmail } = await searchParams;

  if (checkEmail) {
    return (
      <AuthCard title="Check your email" subtitle="We sent a confirmation link — click it to finish signing up.">
        <div />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create an account"
      subtitle="Start discovering apprenticeships matched to you."
      footer={
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-[var(--link)] hover:underline">
              Log in
            </Link>
          </p>
          <p className="text-xs text-muted-foreground/70">
            By signing up you agree to our{" "}
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      }
    >
      {error && <AuthBanner tone="error">{error}</AuthBanner>}

      <form className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-11 rounded-2xl px-4 text-base"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
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
        <Button formAction={signup} size="lg" className="mt-2">
          Sign up
        </Button>
      </form>
    </AuthCard>
  );
}
