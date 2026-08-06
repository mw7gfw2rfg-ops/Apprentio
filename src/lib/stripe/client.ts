import Stripe from "stripe";

export function createStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

// current_period_end lives on the subscription item, not the subscription
// itself, in this API version — verified against the installed SDK's types.
export function getCurrentPeriodEnd(subscription: Stripe.Subscription): string | null {
  const item = subscription.items.data[0];
  return item ? new Date(item.current_period_end * 1000).toISOString() : null;
}

const SUBSCRIPTION_STATUS_ENUM = ["active", "past_due", "canceled", "trialing"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS_ENUM)[number];

// Our subscriptions.status column is a narrower enum than Stripe's actual
// status set (incomplete, incomplete_expired, unpaid, paused, etc. don't
// have a slot). Anything outside our enum is treated as past_due — a
// not-fully-active, needs-attention state, which is the closest honest fit.
export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  return (SUBSCRIPTION_STATUS_ENUM as readonly string[]).includes(status)
    ? (status as SubscriptionStatus)
    : "past_due";
}

export function isActiveStatus(status: Stripe.Subscription.Status): boolean {
  return status === "active" || status === "trialing";
}
