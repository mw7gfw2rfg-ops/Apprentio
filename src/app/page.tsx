import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck, CheckIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HowItWorks } from "@/components/landing/how-it-works";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(900px_520px_at_12%_-6%,var(--warm-sage)_0%,transparent_60%),radial-gradient(760px_460px_at_96%_4%,var(--warm-sky)_0%,transparent_62%),radial-gradient(700px_500px_at_70%_92%,var(--warm-peach)_0%,transparent_60%)] bg-background">
      <div className="grain-overlay" />

      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5">
          <Link href="/" className="mr-auto flex items-center gap-2.5">
            <div className="flex aspect-square size-9 items-center justify-center rounded-[13px_11px_14px_10px] bg-foreground text-background">
              <Logo className="size-[19px]" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight">Apprentio</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <Link
              href="#how"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              How it works
            </Link>
            <Link
              href="#pricing"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Pricing
            </Link>
            <Button variant="outline" size="sm" className="ml-1" render={<Link href="/login" />}>
              Log in
            </Button>
            <Button size="sm" render={<Link href="/signup" />}>
              Sign up free
            </Button>
          </nav>
        </div>
      </header>

      <AnimatedPage>
        <main id="top" className="mx-auto max-w-5xl px-4">
          <section className="grid items-center gap-10 py-10 sm:py-16 md:grid-cols-2 md:gap-14">
            <div>
              <Badge className="h-auto rounded-full border-[var(--warm-sage-border)] bg-[var(--warm-sage)] px-4 py-1.5 text-sm font-bold text-[var(--warm-sage-foreground)]">
                For UK sixth-formers
              </Badge>
              <h1 className="mt-5 max-w-[15ch] text-wrap-pretty font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Find degree apprenticeships{" "}
                <span className="relative inline-block">
                  worth applying to
                  <svg
                    viewBox="0 0 300 22"
                    preserveAspectRatio="none"
                    className="absolute -bottom-2.5 left-0 h-4 w-full motion-safe:[animation:dash-draw_1.1s_.35s_ease-out_backwards]"
                    style={{ strokeDasharray: 320 }}
                  >
                    <path
                      d="M3 14 C 70 4, 150 20, 297 7"
                      fill="none"
                      stroke="var(--warm-peach-foreground)"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{" "}
                — and actually finish the application.
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
                Apprentio matches real vacancies from the gov.uk Find an Apprenticeship
                service and a curated list of employers to your subjects, grades, sector
                interest, and commute radius — then helps you draft a tailored CV and
                cover letter for the ones you want.{" "}
                <em className="font-heading font-bold not-italic text-foreground">
                  You always press submit.
                </em>
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Button size="lg" render={<Link href="/signup" />}>
                  Sign up free
                  <ArrowRight />
                </Button>
                <Button size="lg" variant="outline" render={<Link href="/login" />}>
                  Log in
                </Button>
              </div>
              <p className="mt-4 font-heading text-sm text-muted-foreground">
                Free forever to search &amp; track · no card needed
              </p>
            </div>

            <div className="relative min-h-[380px]" aria-hidden>
              <div
                className="relative z-[2] rounded-[24px_20px_26px_22px] border border-border bg-card p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_26px_46px_-26px_rgba(96,74,52,0.55)] motion-safe:[animation:float-y_7s_ease-in-out_infinite]"
                style={{ "--float-r": "-2.4deg" } as React.CSSProperties}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--warm-sky)] text-[var(--warm-sky-foreground)]">
                      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M20 7h-9M14 17H5M17 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM7 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                      </svg>
                    </span>
                    <div>
                      <div className="font-extrabold">Digital &amp; Technology Solutions</div>
                      <div className="text-sm text-muted-foreground">Level 6 · 14 miles away</div>
                    </div>
                  </div>
                  <span className="whitespace-nowrap rounded-full border border-[var(--warm-sage-border)] bg-[var(--warm-sage)] px-3 py-1.5 font-heading text-sm font-bold text-[var(--warm-sage-foreground)]">
                    92% match
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[var(--warm-tan-border)] bg-[var(--warm-tan)] px-3 py-1.5 text-[13.5px] font-bold text-[var(--warm-tan-foreground)]">
                    Maths A*
                  </span>
                  <span className="rounded-full border border-[var(--warm-tan-border)] bg-[var(--warm-tan)] px-3 py-1.5 text-[13.5px] font-bold text-[var(--warm-tan-foreground)]">
                    Comp Sci
                  </span>
                  <span className="rounded-full border border-[var(--warm-peach-border)] bg-[var(--warm-peach)] px-3 py-1.5 text-[13.5px] font-bold text-[var(--warm-peach-foreground)]">
                    Closes in 9 days
                  </span>
                </div>
              </div>

              <div
                className="absolute right-[-6px] top-[168px] z-[3] w-[min(280px,78%)] rounded-[22px_18px_24px_20px] border border-border bg-card p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_24px_40px_-24px_rgba(96,74,52,0.6)] motion-safe:[animation:float-y_8.5s_.8s_ease-in-out_infinite]"
                style={{ "--float-r": "3.2deg" } as React.CSSProperties}
              >
                <div className="flex items-center gap-2 font-extrabold text-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A5AA8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
                  </svg>
                  Cover letter drafted
                </div>
                <div className="mt-3 grid gap-1.5">
                  <span className="h-2 rounded-full bg-secondary" />
                  <span className="h-2 w-[88%] rounded-full bg-secondary" />
                  <span className="h-2 w-[62%] rounded-full bg-secondary" />
                </div>
                <div className="mt-3.5 font-heading text-sm text-muted-foreground">
                  yours to edit &amp; approve
                </div>
              </div>

              <div
                className="absolute left-0 top-[300px] z-[1] rounded-full border border-[var(--warm-sage-border)] bg-[var(--warm-sage)] px-4 py-2.5 font-heading text-sm font-bold text-[var(--warm-sage-foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] motion-safe:[animation:float-y_9.5s_.4s_ease-in-out_infinite]"
                style={{ "--float-r": "-6deg" } as React.CSSProperties}
              >
                saved → drafted → submitted ✓
              </div>
            </div>
          </section>

          <HowItWorks />

          <section className="py-4 sm:py-8">
            <div className="rounded-[30px_26px_32px_28px] border-2 border-[var(--warm-sage-border)] bg-gradient-to-br from-[var(--warm-sage)] via-secondary to-[var(--warm-peach)] p-6 shadow-[inset_0_2px_0_rgba(255,255,255,0.6),0_34px_54px_-34px_rgba(70,95,80,0.6)] sm:p-9">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex size-[54px] items-center justify-center rounded-full border-2 border-[var(--warm-sage-border)] bg-card">
                  <ShieldCheck className="size-6 text-[var(--warm-sage-foreground)]" />
                </span>
                <h2 className="flex-1 font-heading text-2xl font-bold tracking-tight sm:text-4xl">
                  You always press submit — never us.
                </h2>
              </div>
              <p className="mt-5 max-w-3xl text-[16.5px] leading-relaxed text-foreground/80">
                Apprentio does not and will not automatically submit an application to
                an employer. Every AI-drafted CV and cover letter needs your explicit
                approval before you mark it submitted, and you always send it yourself
                on the employer&apos;s own site. That&apos;s true for every account, on
                every tier, always — not a premium feature, and not something
                we&apos;d ever turn on quietly. If you&apos;re a parent or teacher
                checking this out on a student&apos;s behalf, that&apos;s the guarantee
                that matters most.
              </p>
            </div>
          </section>

          <section id="pricing" className="py-8 sm:py-12">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Free to start
            </h2>
            <p className="mt-2 text-muted-foreground">
              Upgrade only if AI-assisted drafting is worth it to you.
            </p>
            <div className="mt-6 grid items-start gap-5 sm:grid-cols-2">
              <div className="rounded-[26px_22px_28px_24px] border border-border bg-card p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_26px_44px_-28px_rgba(96,74,52,0.55)]">
                <div className="font-heading text-[28px] font-bold">Free</div>
                <p className="mt-1.5 mb-5 text-[15.5px] text-muted-foreground">
                  Everything you need to search and track.
                </p>
                <ul className="grid gap-3 text-[15.5px] leading-relaxed">
                  {[
                    "Discover and match real vacancies to your profile.",
                    "Save applications and track them on your board.",
                    "2 free AI-drafted applications, to try it out.",
                  ].map((line) => (
                    <li key={line} className="flex gap-2.5">
                      <CheckIcon className="mt-0.5 size-[19px] shrink-0 text-[var(--warm-sage-foreground)]" />
                      {line}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="mt-6 w-full" render={<Link href="/signup" />}>
                  Sign up free
                </Button>
              </div>
              <div className="rounded-[26px_22px_28px_24px] border-2 border-[var(--warm-peach-border)] bg-card p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_30px_50px_-28px_rgba(150,90,55,0.5)]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-heading text-[28px] font-bold">Premium</span>
                  <Badge className="h-auto rounded-full border-[var(--warm-peach-border)] bg-[var(--warm-peach)] px-3.5 py-1.5 text-sm font-bold text-[var(--warm-peach-foreground)]">
                    £7.99/mo
                  </Badge>
                </div>
                <p className="mt-1.5 mb-5 text-[15.5px] text-muted-foreground">
                  For students applying to more than a couple.
                </p>
                <ul className="grid gap-3 text-[15.5px] leading-relaxed">
                  {["Everything in Free.", "Unlimited AI-drafted CVs and cover letters, tailored per vacancy."].map(
                    (line) => (
                      <li key={line} className="flex gap-2.5">
                        <CheckIcon className="mt-0.5 size-[19px] shrink-0 text-[var(--warm-peach-foreground)]" />
                        {line}
                      </li>
                    )
                  )}
                </ul>
                <Button className="mt-6 w-full" render={<Link href="/signup" />}>
                  Start free, upgrade later
                </Button>
              </div>
            </div>
          </section>

          <section className="py-12 sm:py-16">
            <div className="flex flex-wrap items-center gap-5 border-t-2 border-dashed border-border pt-10">
              <h2 className="flex-1 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to start?
              </h2>
              <Button size="lg" render={<Link href="/signup" />}>
                Sign up free
                <ArrowRight />
              </Button>
            </div>
          </section>
        </main>
      </AnimatedPage>

      <footer className="border-t border-border/60 bg-card/50">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-7 gap-y-4 px-4 py-8">
          <span className="mr-auto font-heading text-lg font-bold">Apprentio</span>
          <Link href="/privacy" className="text-sm font-bold text-muted-foreground hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-sm font-bold text-muted-foreground hover:underline">
            Terms of Service
          </Link>
          <a
            href="mailto:richardson.archie@yahoo.com"
            className="text-sm font-bold text-muted-foreground hover:underline"
          >
            Contact
          </a>
        </div>
      </footer>
    </div>
  );
}
