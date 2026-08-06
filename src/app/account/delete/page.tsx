import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteAccount } from "./actions";

export default async function DeleteAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">Delete my account</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        This permanently deletes, for <strong>{user.email}</strong>:
      </p>
      <ul className="list-disc pl-5 text-sm text-neutral-600 dark:text-neutral-400">
        <li>Your profile (subjects, grades, postcode, etc.)</li>
        <li>Your uploaded base CV and cover letter</li>
        <li>Every saved application and any AI-drafted content</li>
        <li>Your active subscription, if you have one — cancelled immediately</li>
      </ul>
      <p className="text-sm font-medium text-red-600">
        This can&apos;t be undone.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Type <strong>DELETE</strong> to confirm
          <input
            name="confirmation"
            required
            className="rounded border px-3 py-2"
            autoComplete="off"
          />
        </label>
        <button
          formAction={deleteAccount}
          className="rounded bg-red-600 px-3 py-2 text-sm text-white transition-transform active:scale-[0.97]"
        >
          Permanently delete my account
        </button>
      </form>
    </main>
  );
}
