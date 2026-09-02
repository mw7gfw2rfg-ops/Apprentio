import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CreditCard, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/profile";
import { createCheckoutSession, createPortalSession } from "@/app/billing/actions";
import { computeApplicationAnalytics } from "@/lib/dashboard/analytics";
import { AnalyticsSection } from "@/components/dashboard/analytics-section";
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
    postcode: string | null;
    base_cv_storage_path: string | null;
    base_cv_extracted_text: string | null;
  }>(
    supabase,
    user.id,
    "onboarding_complete, subscription_tier, free_drafts_used, postcode, base_cv_storage_path, base_cv_extracted_text"
  );

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

  const analytics = await computeApplicationAnalytics(supabase, user.id, profile);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:py-10">
      {error && (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
      {checkout === "success" && (
        <p className="rounded-2xl border border-[var(--warm-sage-border)] bg-[var(--warm-sage)] px-4 py-3 text-sm font-semibold text-[var(--warm-sage-foreground)]">
          Subscription started — this may take a few seconds to reflect below.
        </p>
      )}
      {checkout === "cancelled" && (
        <p className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
          Checkout cancelled.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3 [&>div]:min-w-0">
        <div className="overflow-hidden rounded-[24px_20px_26px_22px] border border-border bg-card p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_24px_40px_-28px_rgba(96,74,52,0.55)]">
          <div className="font-extrabold">Applications</div>
          <p className="mt-0.5 mb-3.5 text-[13.5px] text-muted-foreground">
            Everything you&apos;ve saved and tracked.
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-[34px] font-bold">{total}</span>
            <span className="text-sm text-muted-foreground">total</span>
          </div>
          <dl className="mt-3.5 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">In progress</dt>
              <dd className="font-bold">{inProgress}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Submitted</dt>
              <dd className="font-bold">{submitted}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Offers</dt>
              <dd className="font-bold">{offers}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" render={<Link href="/board" />}>
              View board
            </Button>
            <Button variant="outline" size="sm" render={<Link href="/applications" />}>
              Manage
            </Button>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-[24px_20px_26px_22px] border border-[var(--warm-sky-border)] bg-[var(--warm-sky)] p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="font-extrabold text-[var(--warm-sky-foreground)]">
              Discover apprenticeships
            </div>
            <Search className="size-[19px] shrink-0 text-[var(--warm-sky-foreground)]" />
          </div>
          <p className="mt-2 mb-4.5 text-sm leading-relaxed text-[var(--warm-sky-foreground)]/90">
            Matched to your subjects, grades, and commute radius. New vacancies sync
            regularly from gov.uk and curated employers.
          </p>
          <Button className="w-full whitespace-normal" render={<Link href="/discovery" />}>
            Browse apprenticeships
            <ArrowRight className="shrink-0" />
          </Button>
        </div>

        <div className="overflow-hidden rounded-[24px_20px_26px_22px] border border-[var(--warm-peach-border)] bg-[var(--warm-peach)] p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="font-extrabold text-[var(--warm-peach-foreground)]">Account</div>
            <Badge className="border-[var(--warm-peach-border)] bg-card text-[var(--warm-peach-foreground)]">
              {isPremium ? "Premium" : "Free"}
            </Badge>
          </div>
          <p className="mt-2 mb-4.5 text-sm leading-relaxed text-[var(--warm-peach-foreground)]/90">
            {isPremium
              ? "Unlimited AI-drafted CVs and cover letters."
              : `${Math.max(0, 2 - (profile?.free_drafts_used ?? 0))} free AI draft${
                  Math.max(0, 2 - (profile?.free_drafts_used ?? 0)) === 1 ? "" : "s"
                } remaining.`}
          </p>
          <form action={isPremium ? createPortalSession : createCheckoutSession} className="w-full">
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="h-auto w-full min-w-0 whitespace-normal border-[var(--warm-peach-foreground)] py-2 text-center text-[var(--warm-peach-foreground)] hover:bg-[var(--warm-peach-foreground)] hover:text-[var(--warm-peach)]"
            >
              <CreditCard className="shrink-0" />
              {isPremium ? "Manage subscription" : "Upgrade — £7.99/mo"}
            </Button>
          </form>
        </div>
      </div>

      <AnalyticsSection analytics={analytics} total={total} />
    </div>
  );
}
