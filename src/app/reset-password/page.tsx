import { redirect } from "next/navigation";
import Link from "next/link";
import { AnimatedPage } from "@/components/AnimatedPage";
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
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <AnimatedPage className="flex w-full max-w-sm flex-col gap-8">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
        >
          Apprentio
        </Link>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Set a new password</h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Choose a new password for {user.email}.
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <form className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              New password
            </span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-neutral-800 dark:bg-neutral-900 dark:focus:border-indigo-400"
            />
            <span className="text-xs text-neutral-400 dark:text-neutral-600">
              At least 8 characters.
            </span>
          </label>
          <button
            formAction={resetPassword}
            className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            Update password
          </button>
        </form>
      </AnimatedPage>
    </main>
  );
}
