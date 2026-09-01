import Link from "next/link";

export const metadata = { title: "Privacy Policy — Apprentio" };

const h2 = "mt-8 font-heading text-lg font-bold";
const p = "mt-2 text-sm leading-relaxed text-foreground/80";
const li = "mt-1 text-sm leading-relaxed text-foreground/80";

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl bg-background px-4 py-16">
      <div className="rounded-2xl border-2 border-[#EBD59A] bg-[#FBF0D8] p-4 text-sm text-[#6E5A20] shadow-[0_18px_30px_-24px_rgba(150,120,40,0.9)]">
        <strong>Draft — not legally reviewed.</strong> This is a first draft written to
        describe what the app actually does. It has not been checked by a solicitor and
        must not be relied on as a finished policy while real users&apos; data is involved.
      </div>

      <h1 className="mt-8 font-heading text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className={p}>Last updated: 6 August 2026.</p>

      <h2 className={h2}>Who we are</h2>
      <p className={p}>
        Apprentio is a small, independently-run product for UK sixth-form students
        applying to degree apprenticeships, operated by Archie Richardson. For anything
        about your data, contact{" "}
        <a className="font-bold text-[var(--link)] hover:underline" href="mailto:richardson.archie@yahoo.com">
          richardson.archie@yahoo.com
        </a>
        .
      </p>

      <h2 className={h2}>What we collect</h2>
      <ul className="list-disc pl-5">
        <li className={li}>
          <strong>Account:</strong> your email address and password (handled by our auth
          provider, Supabase — we never see your raw password).
        </li>
        <li className={li}>
          <strong>Profile:</strong> full name, school year, subjects and predicted/actual
          grades, sector interests, postcode and commute radius, right-to-work status,
          and whether you&apos;re eligible for security clearance.
        </li>
        <li className={li}>
          <strong>Uploaded documents:</strong> your base CV and cover letter (PDF or
          plain text).
        </li>
        <li className={li}>
          <strong>Applications:</strong> which vacancies you save, the stage you&apos;ve
          marked them at, and any AI-drafted CV/cover letter content generated for a
          specific vacancy.
        </li>
        <li className={li}>
          <strong>Billing:</strong> if you subscribe, Stripe holds your payment details —
          we only ever see your subscription status, not your card details.
        </li>
      </ul>

      <h2 className={h2}>Why we collect it</h2>
      <p className={p}>
        To match you against apprenticeship vacancies, to let you track applications you
        care about, and — for subscribers — to draft a tailored CV and cover letter per
        vacancy using your base documents. Right-to-work and security clearance
        eligibility are used only to help you and prospective employers gauge fit; we
        don&apos;t verify either and we don&apos;t share them with anyone except when
        included in AI-drafted content you choose to approve.
      </p>

      <h2 className={h2}>Who we share it with</h2>
      <ul className="list-disc pl-5">
        <li className={li}>
          <strong>Anthropic</strong> (maker of Claude) — receives your base CV, base
          cover letter, and the target vacancy&apos;s details, solely to generate a
          tailored draft when you ask for one. This only happens for premium accounts and
          only when you click Draft.
        </li>
        <li className={li}>
          <strong>Stripe</strong> — processes subscription payments. Your card details go
          directly to Stripe; they never touch our servers or database.
        </li>
        <li className={li}>
          <strong>Supabase</strong> — hosts our database, authentication, and file
          storage, in the EU.
        </li>
      </ul>
      <p className={p}>We do not sell your data, and we do not use it for advertising.</p>

      <h2 className={h2}>Where it&apos;s stored</h2>
      <p className={p}>
        All of your data — profile, uploaded documents, applications — is stored in
        Supabase&apos;s EU region. AI drafting requests are sent to Anthropic per their
        own data processing terms; we don&apos;t control where Anthropic processes that
        request, only what we send it.
      </p>

      <h2 className={h2}>How long we keep it</h2>
      <p className={p}>
        For as long as your account is active. If you delete your account, your profile,
        uploaded documents, saved applications, and drafted content are deleted, and any
        active subscription is cancelled — see{" "}
        <Link href="/account/delete" className="font-bold text-[var(--link)] hover:underline">
          Delete my account
        </Link>
        . Stripe retains payment/invoice records separately, as required for their own
        accounting and tax obligations.
      </p>

      <h2 className={h2}>Your rights</h2>
      <p className={p}>Under UK GDPR, you can:</p>
      <ul className="list-disc pl-5">
        <li className={li}>
          <strong>Access</strong> the data we hold on you — everything visible in your
          profile and applications already is, in-app.
        </li>
        <li className={li}>
          <strong>Correct</strong> inaccurate data — edit your profile at any time.
        </li>
        <li className={li}>
          <strong>Delete</strong> your account and data — use{" "}
          <Link href="/account/delete" className="font-bold text-[var(--link)] hover:underline">
            Delete my account
          </Link>{" "}
          for a full, immediate purge, or email us.
        </li>
        <li className={li}>
          <strong>Export</strong> your data in a portable format — email us and
          we&apos;ll send it to you (self-service export isn&apos;t built yet).
        </li>
        <li className={li}>Object to or restrict certain processing — email us.</li>
      </ul>

      <h2 className={h2}>Sixth-formers and age</h2>
      <p className={p}>
        Apprentio is aimed at students aged 16–18. UK GDPR sets the age of digital
        consent at 13, so if you&apos;re in our target age range you can create an
        account and consent to this policy yourself, without a parent or guardian.
      </p>

      <h2 className={h2}>Cookies</h2>
      <p className={p}>
        We use a single essential cookie to keep you signed in. We don&apos;t use
        tracking or advertising cookies.
      </p>

      <h2 className={h2}>Changes to this policy</h2>
      <p className={p}>
        We&apos;ll update the date at the top of this page when this policy changes. As
        noted above, this is currently a first draft.
      </p>
    </main>
  );
}
