import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4 py-16">
      <div className="rounded-[26px_22px_28px_24px] border-2 border-[var(--warm-peach-border)] bg-card p-7 shadow-[0_30px_50px_-30px_rgba(150,90,55,0.5)]">
        <h1 className="font-heading text-2xl font-bold">Delete my account</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This permanently deletes, for <strong className="text-foreground">{user.email}</strong>:
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
          <li>Your profile (subjects, grades, postcode, etc.)</li>
          <li>Your uploaded base CV and cover letter</li>
          <li>Every saved application and any AI-drafted content</li>
          <li>Your active subscription, if you have one — cancelled immediately</li>
        </ul>
        <p className="mt-3 text-sm font-bold text-[var(--link)]">This can&apos;t be undone.</p>

        {error && (
          <p className="mt-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </p>
        )}

        <form className="mt-5 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-bold text-muted-foreground">
            Type <strong className="text-foreground">DELETE</strong> to confirm
            <Input name="confirmation" required autoComplete="off" className="h-11 rounded-2xl px-4 text-base" />
          </label>
          <Button
            type="submit"
            formAction={deleteAccount}
            variant="destructive"
            className="border-2 border-destructive"
          >
            Permanently delete my account
          </Button>
        </form>
      </div>
    </main>
  );
}
