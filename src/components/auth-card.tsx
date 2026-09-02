import Link from "next/link";
import type { ReactNode } from "react";
import { AnimatedPage } from "@/components/AnimatedPage";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(900px_520px_at_12%_-6%,var(--warm-sage)_0%,transparent_60%),radial-gradient(760px_460px_at_96%_4%,var(--warm-sky)_0%,transparent_62%)] bg-background">
      <div className="grain-overlay" />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <AnimatedPage className="w-full max-w-[430px]">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 font-heading text-lg font-bold">
            Apprentio
          </Link>
          <div className="rounded-[28px_24px_30px_26px] border border-border bg-card p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_34px_56px_-32px_rgba(96,74,52,0.6)] sm:p-9">
            <h1 className="font-heading text-4xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 mb-6 text-muted-foreground">{subtitle}</p>
            {children}
          </div>
          {footer && <div className="mt-4 px-2">{footer}</div>}
        </AnimatedPage>
      </main>
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

export function AuthBanner({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: ReactNode;
}) {
  return (
    <p
      className={
        tone === "success"
          ? "mb-4 rounded-2xl border border-[var(--warm-sage-border)] bg-[var(--warm-sage)] px-4 py-3 text-sm font-semibold text-[var(--warm-sage-foreground)]"
          : "mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
      }
    >
      {children}
    </p>
  );
}
