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

  // Delete the Stripe Customer first — once the user row is deleted
  // (cascading to `subscriptions`), we lose the reference to it. Deleting
  // the Customer object (not just canceling the subscription) immediately
  // cancels any active subscription on it too — that's Stripe's own
  // documented behaviour for this call, not an assumption — so this single
  // call is sufficient; a separate subscriptions.cancel() would be
  // redundant. Canceling without deleting the Customer would leave a real
  // paying user's PII (email, saved payment methods) sitting in Stripe
  // indefinitely after their Apprentio account no longer exists.
  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sub?.stripe_customer_id) {
    try {
      const stripe = createStripeClient();
      await stripe.customers.del(sub.stripe_customer_id);
    } catch (err) {
      // Already-deleted customers error on a second delete — don't let
      // that block account deletion.
      console.error("Failed to delete Stripe customer during account deletion", err);
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
