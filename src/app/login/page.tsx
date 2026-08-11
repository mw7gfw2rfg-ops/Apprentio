import Link from "next/link";
import { AnimatedPage } from "@/components/AnimatedPage";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; passwordReset?: string }>;
}) {
  const { error, passwordReset } = await searchParams;

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
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Log in to keep tracking your applications.
          </p>
        </div>

        {passwordReset && (
          <p className="rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
            Password updated — log in with your new password.
          </p>
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-sm">
            <label
              htmlFor="email"
              className="font-medium text-neutral-700 dark:text-neutral-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-neutral-800 dark:bg-neutral-900 dark:focus:border-indigo-400"
            />
          </div>
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="font-medium text-neutral-700 dark:text-neutral-300"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-neutral-800 dark:bg-neutral-900 dark:focus:border-indigo-400"
            />
          </div>
          <button
            formAction={login}
            className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            Log in
          </button>
        </form>

        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          No account?{" "}
          <Link
            href="/signup"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Sign up
          </Link>
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-600">
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
        </p>
      </AnimatedPage>
    </main>
  );
}
