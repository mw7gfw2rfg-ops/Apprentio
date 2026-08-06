import Link from "next/link";

export default function AccountDeletedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">Account deleted</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Your profile, uploaded documents, saved applications, and any active
        subscription have been removed.
      </p>
      <Link href="/login" className="text-sm underline">
        Back to login
      </Link>
    </main>
  );
}
