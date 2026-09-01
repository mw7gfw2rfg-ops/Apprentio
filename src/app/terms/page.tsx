import Link from "next/link";

export const metadata = { title: "Terms of Service — Apprentio" };

const h2 = "mt-8 font-heading text-lg font-bold";
const p = "mt-2 text-sm leading-relaxed text-foreground/80";

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-2xl bg-background px-4 py-16">
      <div className="rounded-2xl border-2 border-[#EBD59A] bg-[#FBF0D8] p-4 text-sm text-[#6E5A20] shadow-[0_18px_30px_-24px_rgba(150,120,40,0.9)]">
        <strong>Draft — not legally reviewed.</strong> This is a first draft written to
        describe what the app actually does. It has not been checked by a solicitor and
        must not be relied on as a finished agreement while real users&apos; data is
        involved.
      </div>

      <h1 className="mt-8 font-heading text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className={p}>Last updated: 6 August 2026.</p>

      <h2 className={h2}>What Apprentio is</h2>
      <p className={p}>
        Apprentio helps UK sixth-form students discover degree apprenticeship vacancies,
        track applications, and — on the premium tier — get an AI-drafted, per-vacancy
        tailored CV and cover letter from documents you provide.
      </p>

      <h2 className={h2}>We never submit anything on your behalf</h2>
      <p className={p}>
        Apprentio does not and will not automatically submit an application to an
        employer. Every application requires your explicit approval of the final content
        before you mark it submitted, and you always submit it yourself on the
        employer&apos;s own site. This isn&apos;t a premium feature — it applies to every
        account, always.
      </p>

      <h2 className={h2}>Your account</h2>
      <p className={p}>
        You&apos;re responsible for keeping your login details secure and for the
        accuracy of what you enter — including right-to-work and security clearance
        eligibility, which we don&apos;t independently verify. You must be old enough to
        legally consent to this agreement in your own right (see our{" "}
        <Link href="/privacy" className="font-bold text-[var(--link)] hover:underline">
          Privacy Policy
        </Link>
        ).
      </p>

      <h2 className={h2}>Subscriptions and billing</h2>
      <p className={p}>
        The free tier covers vacancy discovery and application tracking, with two AI
        drafts included. The premium tier (billed monthly via Stripe) unlocks unlimited
        AI drafting. You can cancel any time via the Stripe customer portal — access
        continues until the end of the paid period. Payment is handled entirely by
        Stripe; we never see or store your card details.
      </p>

      <h2 className={h2}>AI-drafted content</h2>
      <p className={p}>
        Drafted CVs and cover letters are generated from documents you upload and the
        vacancy&apos;s public listing. They&apos;re a starting point, not a finished
        product — AI can misstate or misjudge things, and you&apos;re responsible for
        reading, editing, and approving anything before it&apos;s used in a real
        application. We don&apos;t guarantee accuracy, tone, or that a draft improves
        your chances.
      </p>

      <h2 className={h2}>Acceptable use</h2>
      <p className={p}>
        Don&apos;t use Apprentio to submit false information to an employer, to scrape or
        resell vacancy data, or to try to access another student&apos;s account or data.
      </p>

      <h2 className={h2}>Your content</h2>
      <p className={p}>
        You keep ownership of your CV, cover letter, and anything else you upload. You
        give us permission to use it only to provide the service back to you (matching,
        drafting, display).
      </p>

      <h2 className={h2}>Ending your account</h2>
      <p className={p}>
        You can delete your account at any time — see{" "}
        <Link href="/account/delete" className="font-bold text-[var(--link)] hover:underline">
          Delete my account
        </Link>
        . This permanently removes your profile, uploaded documents, saved applications,
        and drafted content, and cancels any active subscription immediately.
      </p>

      <h2 className={h2}>No guarantees</h2>
      <p className={p}>
        Apprentio is provided as-is, without warranty of any kind. We&apos;re not liable
        for vacancy data going stale, an employer&apos;s hiring decision, or losses
        arising from your use of the service, to the fullest extent the law allows.
      </p>

      <h2 className={h2}>Governing law</h2>
      <p className={p}>These terms are governed by the law of England and Wales.</p>

      <h2 className={h2}>Changes to these terms</h2>
      <p className={p}>
        We&apos;ll update the date at the top of this page when these terms change.
      </p>

      <h2 className={h2}>Contact</h2>
      <p className={p}>
        <a className="font-bold text-[var(--link)] hover:underline" href="mailto:richardson.archie@yahoo.com">
          richardson.archie@yahoo.com
        </a>
      </p>
    </main>
  );
}
