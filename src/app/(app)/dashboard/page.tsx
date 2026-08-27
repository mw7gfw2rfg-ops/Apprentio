import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CreditCard, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/profile";
import { createCheckoutSession, createPortalSession } from "@/app/billing/actions";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const IN_PROGRESS_STAGES = ["saved", "drafting", "ready_for_review", "approved"];
const SUBMITTED_STAGES = ["submitted", "interview"];

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

  const profile = await requireProfile<{
    onboarding_complete: boolean;
    subscription_tier: string;
    free_drafts_used: number;
  }>(supabase, user.id, "onboarding_complete, subscription_tier, free_drafts_used");

  if (!profile.onboarding_complete) {
    redirect("/onboarding");
  }

  const isPremium = profile.subscription_tier === "premium";

  const { data: applications } = await supabase
    .from("applications")
    .select("stage")
    .eq("user_id", user.id);

  const stages = (applications ?? []).map((a) => a.stage);
  const total = stages.length;
  const inProgress = stages.filter((s) => IN_PROGRESS_STAGES.includes(s)).length;
  const submitted = stages.filter((s) => SUBMITTED_STAGES.includes(s)).length;
  const offers = stages.filter((s) => s === "offer").length;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Signed in as {user.email}</p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      {checkout === "success" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          Subscription started — this may take a few seconds to reflect below.
        </p>
      )}
      {checkout === "cancelled" && (
        <p className="rounded-lg border px-3.5 py-2.5 text-sm text-muted-foreground">
          Checkout cancelled.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>Everything you&apos;ve saved and tracked.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">{total}</span>
              <span className="text-sm text-muted-foreground">total</span>
            </div>
            <dl className="mt-4 flex flex-col gap-1.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">In progress</dt>
                <dd className="font-medium">{inProgress}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Submitted</dt>
                <dd className="font-medium">{submitted}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Offers</dt>
                <dd className="font-medium">{offers}</dd>
              </div>
            </dl>
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="outline" size="sm" render={<Link href="/board" />}>
              View board
            </Button>
            <Button variant="outline" size="sm" render={<Link href="/applications" />}>
              Manage applications
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Discover apprenticeships</CardTitle>
            <CardDescription>
              Matched to your subjects, grades, and commute radius.
            </CardDescription>
            <CardAction>
              <Search className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              New vacancies sync regularly from the gov.uk Find an Apprenticeship service
              and a curated employer list.
            </p>
          </CardContent>
          <CardFooter>
            <Button render={<Link href="/discovery" />}>
              Browse apprenticeships
              <ArrowRight />
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Subscription and billing.</CardDescription>
            <CardAction>
              <Badge variant={isPremium ? "default" : "secondary"}>
                {isPremium ? "Premium" : "Free"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isPremium
                ? "Unlimited AI-drafted CVs and cover letters."
                : `${Math.max(0, 2 - (profile?.free_drafts_used ?? 0))} free AI draft${
                    Math.max(0, 2 - (profile?.free_drafts_used ?? 0)) === 1 ? "" : "s"
                  } remaining.`}
            </p>
          </CardContent>
          <CardFooter>
            <form action={isPremium ? createPortalSession : createCheckoutSession}>
              <Button type="submit" variant={isPremium ? "outline" : "default"} size="sm">
                <CreditCard />
                {isPremium ? "Manage subscription" : "Upgrade to Premium — £7.99/mo"}
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
