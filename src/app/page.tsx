import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Search, Sparkles, KanbanSquare, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Logo className="size-5" />
          </div>
          <span className="text-base font-semibold tracking-tight">Apprentio</span>
        </Link>
        <Button variant="outline" render={<Link href="/login" />}>
          Log in
        </Button>
      </header>

      <AnimatedPage className="mx-auto flex w-full max-w-5xl flex-col gap-24 px-4 pb-24">
        <section className="flex flex-col items-start gap-6 pt-8 sm:pt-16">
          <Badge variant="secondary">For UK sixth-formers</Badge>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Find degree apprenticeships worth applying to — and actually finish the
            application.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Apprentio matches real vacancies from the gov.uk Find an Apprenticeship
            service and a curated list of employers to your subjects, grades, sector
            interest, and commute radius — then helps you draft a tailored CV and cover
            letter for the ones you want. You always press submit.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" render={<Link href="/signup" />}>
              Sign up free
              <ArrowRight />
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/login" />}>
              Log in
            </Button>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <Search className="size-5 text-primary" />
              <CardTitle className="mt-2">Discover &amp; match</CardTitle>
              <CardDescription>
                Real vacancies pulled from gov.uk&apos;s Find an Apprenticeship service
                and a hand-curated employer list, matched to your subjects, predicted
                grades, sector interest, and commute radius.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Sparkles className="size-5 text-primary" />
              <CardTitle className="mt-2">AI-assisted drafting</CardTitle>
              <CardDescription>
                A tailored CV and cover letter drafted per vacancy from your own base
                documents — a starting point you edit and approve, not a finished
                submission.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <KanbanSquare className="size-5 text-primary" />
              <CardTitle className="mt-2">Track everything</CardTitle>
              <CardDescription>
                A single board showing every application&apos;s stage, from saved
                through offer, so nothing you care about gets lost in a spreadsheet.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="rounded-2xl border bg-card p-8">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              You always press submit — never us.
            </h2>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Apprentio does not and will not automatically submit an application to an
            employer. Every AI-drafted CV and cover letter needs your explicit approval
            before you mark it submitted, and you always send it yourself on the
            employer&apos;s own site. That&apos;s true for every account, on every
            tier, always — not a premium feature, and not something we&apos;d ever
            turn on quietly. If you&apos;re a parent or teacher checking this out on a
            student&apos;s behalf, that&apos;s the guarantee that matters most.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight">Free to start</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Upgrade only if AI-assisted drafting is worth it to you.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>Everything you need to search and track.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <p>Discover and match real vacancies to your profile.</p>
                <p>Save applications and track them on your board.</p>
                <p>2 free AI-drafted applications, to try it out.</p>
              </CardContent>
            </Card>
            <Card className="ring-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Premium
                  <Badge variant="default">£7.99/mo</Badge>
                </CardTitle>
                <CardDescription>For students applying to more than a couple.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <p>Everything in Free.</p>
                <p>Unlimited AI-drafted CVs and cover letters, tailored per vacancy.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="flex flex-col items-start gap-4 border-t pt-16">
          <h2 className="text-2xl font-semibold tracking-tight">Ready to start?</h2>
          <Button size="lg" render={<Link href="/signup" />}>
            Sign up free
            <ArrowRight />
          </Button>
        </section>
      </AnimatedPage>

      <footer className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 pb-10 text-xs text-muted-foreground">
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
        </div>
      </footer>
    </main>
  );
}
