import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete, subscription_tier")
    .eq("user_id", user.id)
    .single();

  if (!profile?.onboarding_complete) {
    redirect("/onboarding");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm">Signed in as {user.email}</p>
      <p className="text-sm">
        Subscription: {profile?.subscription_tier ?? "free"} — onboarding complete
      </p>
      <Link href="/discovery" className="text-sm underline">
        Browse apprenticeships
      </Link>
      <form>
        <button
          formAction={signOut}
          className="rounded border px-3 py-2 text-sm"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
