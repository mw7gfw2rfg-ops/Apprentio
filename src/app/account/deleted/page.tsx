import Link from "next/link";

export default function AccountDeletedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 bg-background px-4">
      <h1 className="font-heading text-2xl font-bold">Account deleted</h1>
      <p className="text-sm text-muted-foreground">
        Your profile, uploaded documents, saved applications, and any active
        subscription have been removed.
      </p>
      <Link href="/login" className="text-sm font-bold text-[var(--link)] hover:underline">
        Back to login
      </Link>
    </main>
  );
}
