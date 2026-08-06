import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Pill } from "@/components/vacancy-pill";
import { stripHtml } from "@/lib/vacancies/format";
import type { FaaVacancy } from "@/lib/vacancies/faa-client";
import { saveVacancy } from "../../discovery/actions";

type VacancyDetail = {
  id: string;
  source: "gov_api" | "curated";
  employer_name: string;
  role_title: string;
  apprenticeship_level: number | null;
  sector: string[];
  location: string | null;
  postcode: string | null;
  closing_date: string | null;
  start_date: string | null;
  apply_url: string | null;
  description: string | null;
  raw_json: unknown;
  employer_sources: { portal_url: string | null } | null;
};

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {title}
      </h2>
      <div className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        {children}
      </div>
    </div>
  );
}

export default async function VacancyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("user_id", user.id)
    .single();

  if (!profile?.onboarding_complete) {
    redirect("/onboarding");
  }

  const { data: vacancy } = await supabase
    .from("vacancies")
    .select(
      "id, source, employer_name, role_title, apprenticeship_level, sector, location, postcode, closing_date, start_date, apply_url, description, raw_json, employer_sources(portal_url)"
    )
    .eq("id", id)
    .maybeSingle<VacancyDetail>();

  if (!vacancy) {
    notFound();
  }

  const { data: savedRow } = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", user.id)
    .eq("vacancy_id", vacancy.id)
    .maybeSingle();
  const isSaved = !!savedRow;

  const faa = vacancy.source === "gov_api" ? (vacancy.raw_json as FaaVacancy) : null;

  const fullDescription = faa ? stripHtml(faa.fullDescription) || stripHtml(faa.description) : "";
  const employerDescription = faa ? stripHtml(faa.employerDescription) : "";
  const trainingDescription = faa ? stripHtml(faa.trainingDescription) : "";
  const outcomeDescription = faa ? stripHtml(faa.outcomeDescription) : "";

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-16">
      <Link
        href="/discovery"
        className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
      >
        ← Back to Discover
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{vacancy.role_title}</h1>
          <p className="mt-1 text-base text-neutral-500 dark:text-neutral-400">
            {vacancy.employer_name}
          </p>
        </div>
        <form className="shrink-0">
          <input type="hidden" name="vacancy_id" value={vacancy.id} />
          <button
            formAction={saveVacancy}
            disabled={isSaved}
            className={
              isSaved
                ? "rounded-full border border-neutral-200 px-4 py-1.5 text-sm font-medium text-neutral-400 dark:border-neutral-700 dark:text-neutral-500"
                : "rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 active:scale-[0.97] dark:bg-indigo-500 dark:hover:bg-indigo-400"
            }
          >
            {isSaved ? "✓ Saved" : "Save"}
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <Pill>Level {vacancy.apprenticeship_level ?? "—"}</Pill>
        {vacancy.sector.map((sector) => (
          <Pill key={sector}>{sector}</Pill>
        ))}
        <Pill>{vacancy.location ?? vacancy.postcode ?? "—"}</Pill>
        <Pill>Closes {vacancy.closing_date ?? "—"}</Pill>
        <Pill>
          {vacancy.start_date ? `Starts ${vacancy.start_date}` : "Start date not specified"}
        </Pill>
      </div>

      {faa && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border border-neutral-200 p-4 sm:grid-cols-3 dark:border-neutral-800">
          {faa.wage?.wageAdditionalInformation && (
            <Fact label="Wage" value={faa.wage.wageAdditionalInformation} />
          )}
          {faa.hoursPerWeek != null && (
            <Fact label="Hours per week" value={String(faa.hoursPerWeek)} />
          )}
          {faa.expectedDuration && <Fact label="Duration" value={faa.expectedDuration} />}
          {faa.numberOfPositions != null && faa.numberOfPositions > 1 && (
            <Fact label="Positions available" value={String(faa.numberOfPositions)} />
          )}
          {faa.providerName && <Fact label="Training provider" value={faa.providerName} />}
          {faa.wage?.workingWeekDescription && (
            <Fact label="Working week" value={faa.wage.workingWeekDescription} />
          )}
        </dl>
      )}

      {fullDescription && (
        <Section title="Description">
          <p className="whitespace-pre-line">{fullDescription}</p>
        </Section>
      )}

      {!faa && vacancy.description && (
        <Section title="Description">
          <p className="whitespace-pre-line">{vacancy.description}</p>
        </Section>
      )}

      {employerDescription && (
        <Section title="About the employer">
          <p className="whitespace-pre-line">{employerDescription}</p>
        </Section>
      )}

      {trainingDescription && (
        <Section title="Training you'll receive">
          <p className="whitespace-pre-line">{trainingDescription}</p>
        </Section>
      )}

      {faa?.qualifications && faa.qualifications.length > 0 && (
        <Section title="Entry requirements">
          <ul className="flex flex-col gap-1">
            {faa.qualifications.map((q, i) => (
              <li key={i}>
                {[q.subject, q.qualificationType, q.grade && `grade ${q.grade}`, q.weighting]
                  .filter(Boolean)
                  .join(" — ")}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {faa?.skills && faa.skills.length > 0 && (
        <Section title="Skills">
          <div className="flex flex-wrap gap-2">
            {faa.skills.map((skill) => (
              <Pill key={skill}>{skill}</Pill>
            ))}
          </div>
        </Section>
      )}

      {outcomeDescription && (
        <Section title="What happens next">
          <p className="whitespace-pre-line">{outcomeDescription}</p>
        </Section>
      )}

      <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
        {vacancy.source === "gov_api" && vacancy.apply_url && (
          <a
            href={vacancy.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-neutral-500 underline hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            View original listing ↗
          </a>
        )}
        {vacancy.source === "curated" && vacancy.employer_sources?.portal_url && (
          <a
            href={vacancy.employer_sources.portal_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-neutral-500 underline hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            View on {vacancy.employer_name}&apos;s site ↗
          </a>
        )}
      </div>
    </main>
  );
}
