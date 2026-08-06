"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStripeClient } from "@/lib/stripe/client";

const BUCKET = "base-documents";

export async function deleteAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const confirmation = (formData.get("confirmation") as string | null)
    ?.trim()
    .toLowerCase();
  if (confirmation !== "delete") {
    redirect("/account/delete?error=Type DELETE to confirm");
  }

  const admin = createAdminClient();

  // Cancel any active Stripe subscription first — once the user row is
  // deleted (cascading to `subscriptions`), we lose the reference to it.
  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sub?.stripe_subscription_id) {
    try {
      const stripe = createStripeClient();
      await stripe.subscriptions.cancel(sub.stripe_subscription_id);
    } catch (err) {
      // Already-canceled subscriptions error on a second cancel — don't let
      // that block account deletion.
      console.error("Failed to cancel subscription during account deletion", err);
    }
  }

  // Storage objects aren't foreign-keyed to the user row, so they need an
  // explicit delete before (or after — order doesn't matter here) removing
  // the account itself.
  const { data: files } = await admin.storage.from(BUCKET).list(user.id);
  if (files && files.length > 0) {
    await admin.storage.from(BUCKET).remove(files.map((f) => `${user.id}/${f.name}`));
  }

  // Deleting the auth user cascades (ON DELETE CASCADE) to profiles,
  // applications, application_events, and subscriptions.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    redirect(`/account/delete?error=${encodeURIComponent(error.message)}`);
  }

  try {
    // The user no longer exists server-side at this point, so this may
    // itself error — that's fine, the goal is just clearing the local
    // session cookie; proxy.ts's getUser() check will reject the stale
    // session either way.
    await supabase.auth.signOut();
  } catch (err) {
    console.error("signOut after account deletion failed (non-fatal)", err);
  }

  redirect("/account/deleted");
}
