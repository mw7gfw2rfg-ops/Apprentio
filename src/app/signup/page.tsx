import Link from "next/link";
import { AnimatedPage } from "@/components/AnimatedPage";
import { signup } from "../login/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; checkEmail?: string }>;
}) {
  const { error, checkEmail } = await searchParams;

  if (checkEmail) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <AnimatedPage className="flex w-full max-w-sm flex-col gap-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
          >
            Apprentio
          </Link>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Check your email</h1>
            <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
              We sent a confirmation link — click it to finish signing up.
            </p>
          </div>
        </AnimatedPage>
      </main>
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
          <h1 className="text-3xl font-semibold tracking-tight">Create an account</h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Start discovering apprenticeships matched to you.
          </p>
        </div>

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
            <label
              htmlFor="password"
              className="font-medium text-neutral-700 dark:text-neutral-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              aria-describedby="password-hint"
              className="rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-neutral-800 dark:bg-neutral-900 dark:focus:border-indigo-400"
            />
            <span id="password-hint" className="text-xs text-neutral-400 dark:text-neutral-600">
              At least 8 characters.
            </span>
          </div>
          <button
            formAction={signup}
            className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            Sign up
          </button>
        </form>

        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Log in
          </Link>
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-600">
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
      </AnimatedPage>
    </main>
  );
}
