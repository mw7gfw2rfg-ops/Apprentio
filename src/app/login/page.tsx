import Link from "next/link";
import { AuthCard, AuthBanner } from "@/components/auth-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; passwordReset?: string }>;
}) {
  const { error, passwordReset } = await searchParams;

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to keep tracking your applications."
      footer={
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/signup" className="font-bold text-[var(--link)] hover:underline">
              Sign up
            </Link>
          </p>
          <p className="text-xs text-muted-foreground/70">
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>{" "}
            ·{" "}
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
          </p>
        </div>
      }
    >
      {passwordReset && <AuthBanner tone="success">Password updated — log in with your new password.</AuthBanner>}
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
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-bold text-[var(--link)] hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="h-11 rounded-2xl px-4 text-base"
          />
        </div>
        <Button type="submit" formAction={login} size="lg" className="mt-2">
          Log in
        </Button>
      </form>
    </AuthCard>
  );
}
