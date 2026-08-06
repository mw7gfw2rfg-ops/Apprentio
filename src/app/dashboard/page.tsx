import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";
import { createCheckoutSession, createPortalSession } from "../billing/actions";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; error?: string }>;
}) {
  const { checkout, error } = await searchParams;
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

  const isPremium = profile?.subscription_tier === "premium";

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm">Signed in as {user.email}</p>
      <p className="text-sm">
        Subscription: {profile?.subscription_tier ?? "free"} — onboarding complete
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {checkout === "success" && (
        <p className="text-sm text-green-600">
          Subscription started — this may take a few seconds to reflect below.
        </p>
      )}
      {checkout === "cancelled" && (
        <p className="text-sm text-neutral-500">Checkout cancelled.</p>
      )}
      <Link href="/discovery" className="text-sm underline">
        Browse apprenticeships
      </Link>
      <Link href="/applications" className="text-sm underline">
        My applications
      </Link>
      <Link href="/board" className="text-sm underline">
        Application board
      </Link>
      {isPremium ? (
        <form>
          <button
            formAction={createPortalSession}
            className="rounded border px-3 py-2 text-sm transition-transform active:scale-[0.97]"
          >
            Manage subscription
          </button>
        </form>
      ) : (
        <form>
          <button
            formAction={createCheckoutSession}
            className="rounded bg-black px-3 py-2 text-sm text-white transition-transform active:scale-[0.97]"
          >
            Upgrade to Premium — £7.99/mo
          </button>
        </form>
      )}
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
