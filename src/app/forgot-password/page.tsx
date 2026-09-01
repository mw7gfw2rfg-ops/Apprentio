import Link from "next/link";
import { AuthCard, AuthBanner } from "@/components/auth-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "../login/actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; checkEmail?: string }>;
}) {
  const { error, checkEmail } = await searchParams;

  if (checkEmail) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="If an account exists for that address, we've sent a link to reset your password."
        footer={
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="font-bold text-[var(--link)] hover:underline">
              Back to log in
            </Link>
          </p>
        }
      >
        <div />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="font-bold text-[var(--link)] hover:underline">
            Back to log in
          </Link>
        </p>
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
        <Button formAction={requestPasswordReset} size="lg" className="mt-2">
          Send reset link
        </Button>
      </form>
    </AuthCard>
  );
}
