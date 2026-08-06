import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createStripeClient,
  getCurrentPeriodEnd,
  isActiveStatus,
  mapStripeStatus,
} from "@/lib/stripe/client";

// The only writer of profiles.subscription_tier and the subscriptions table
// (PLAN.md §7). Runs entirely on the admin (service-role) client — there is
// no user session here, just a signed event from Stripe.

async function upsertFromSubscription(
  userId: string,
  customerId: string,
  subscription: Stripe.Subscription
) {
  const supabase = createAdminClient();
  const status = mapStripeStatus(subscription.status);

  const { error: subError } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status,
      current_period_end: getCurrentPeriodEnd(subscription),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (subError) throw new Error(`subscriptions upsert failed: ${subError.message}`);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      subscription_tier: isActiveStatus(subscription.status) ? "premium" : "free",
    })
    .eq("user_id", userId);
  if (profileError) throw new Error(`profiles update failed: ${profileError.message}`);
}

async function findUserIdByCustomerId(customerId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.user_id ?? null;
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = createStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Signature verification failed: ${err instanceof Error ? err.message : err}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;
        if (!userId || !customerId || !subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertFromSubscription(userId, customerId, subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = await findUserIdByCustomerId(customerId);
        if (!userId) break;
        await upsertFromSubscription(userId, customerId, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = await findUserIdByCustomerId(customerId);
        if (!userId) break;

        const supabase = createAdminClient();
        await supabase
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("user_id", userId);
        await supabase
          .from("profiles")
          .update({ subscription_tier: "free" })
          .eq("user_id", userId);
        break;
      }
    }
  } catch (err) {
    console.error("Stripe webhook handler error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
