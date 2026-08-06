"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createStripeClient } from "@/lib/stripe/client";

// Never writes profiles.subscription_tier or the subscriptions table —
// that's the webhook's job exclusively (PLAN.md §7). This only ever talks
// to Stripe and redirects.

export async function createCheckoutSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("user_id", user.id)
    .single();

  if (profile?.subscription_tier === "premium") {
    redirect("/dashboard");
  }

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const stripe = createStripeClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    client_reference_id: user.id,
    ...(existingSub?.stripe_customer_id
      ? { customer: existingSub.stripe_customer_id }
      : { customer_email: user.email }),
    success_url: `${siteUrl}/dashboard?checkout=success`,
    cancel_url: `${siteUrl}/dashboard?checkout=cancelled`,
  });

  if (!session.url) {
    redirect("/dashboard?error=Could not start checkout");
  }

  redirect(session.url);
}

export async function createPortalSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sub?.stripe_customer_id) {
    redirect("/dashboard?error=No billing account found");
  }

  const stripe = createStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
  });

  redirect(session.url);
}
