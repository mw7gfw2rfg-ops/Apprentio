import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { geocodePostcode } from "@/lib/vacancies/geocode";
import { haversineMiles, maxCommuteMiles } from "@/lib/vacancies/distance";
import { sectorsToFaaRoutes } from "@/lib/vacancies/sector-mapping";
import { parseGradeEligibilitySignal } from "@/lib/vacancies/grade-signal";
import type { FaaVacancy } from "@/lib/vacancies/faa-client";
import { DiscoveryFilters } from "./DiscoveryFilters";
import { DiscoveryBoard, type VacancyMatch } from "./DiscoveryBoard";
import { getVacancyDetail, saveVacancy } from "./actions";

type VacancyRow = {
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
  latitude: number | null;
  longitude: number | null;
  raw_json: unknown;
};

const ANY = "any";

export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    sectors?: string;
    level?: string;
    commute?: string;
    closing_within?: string;
    starts_by?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "onboarding_complete, sectors_of_interest, postcode, max_commute_minutes, minimum_apprenticeship_level"
    )
    .eq("user_id", user.id)
    .single();

  if (!profile?.onboarding_complete) {
    redirect("/onboarding");
  }

  // Each filter falls back to the profile's own default only when its param
  // is entirely absent from the URL -- once the user has touched a control
  // (including clearing it to "any"), that explicit choice always wins.
  const activeSectors =
    params.sectors !== undefined
      ? params.sectors
        ? params.sectors.split(",")
        : []
      : (profile.sectors_of_interest ?? []);

  const activeLevel =
    params.level === undefined
      ? profile.minimum_apprenticeship_level
      : params.level === ANY
        ? null
        : Number(params.level);

  const activeCommute =
    params.commute === undefined
      ? profile.max_commute_minutes
      : params.commute === ANY
        ? null
        : Number(params.commute);

  const activeClosingWithin =
    params.closing_within && params.closing_within !== ANY ? params.closing_within : null;

  const activeStartsBy = params.starts_by || null;

  const routes = sectorsToFaaRoutes(activeSectors);
  const today = new Date().toISOString().slice(0, 10);

  let matches: VacancyMatch[] = [];
  let geocodeFailed = false;

  if (routes.length > 0 && profile.postcode) {
    const coords = await geocodePostcode(profile.postcode);
    if (!coords) {
      geocodeFailed = true;
    } else {
      let vacanciesQuery = supabase
        .from("vacancies")
        .select(
          "id, source, employer_name, role_title, apprenticeship_level, sector, location, postcode, closing_date, start_date, latitude, longitude, raw_json"
        )
        .gte("closing_date", today)
        .overlaps("sector", routes)
        .order("closing_date", { ascending: true });

      if (activeLevel != null) {
        vacanciesQuery = vacanciesQuery.gte("apprenticeship_level", activeLevel);
      }
      if (activeClosingWithin) {
        const cutoff = new Date(
          new Date(today).getTime() + Number(activeClosingWithin) * 86400000
        )
          .toISOString()
          .slice(0, 10);
        vacanciesQuery = vacanciesQuery.lte("closing_date", cutoff);
      }
      if (activeStartsBy) {
        vacanciesQuery = vacanciesQuery.lte("start_date", activeStartsBy);
      }

      const { data: vacancies } = await vacanciesQuery.returns<VacancyRow[]>();

      const withDistance = (vacancies ?? [])
        .filter((v) => v.latitude != null && v.longitude != null)
        .map((v) => {
          const { raw_json, ...rest } = v;
          return {
            ...rest,
            distanceMiles: haversineMiles(coords.latitude, coords.longitude, v.latitude!, v.longitude!),
            gradeSignal:
              v.source === "gov_api"
                ? parseGradeEligibilitySignal((raw_json as FaaVacancy | null)?.qualifications)
                : null,
          };
        });

      const maxMiles = activeCommute != null ? maxCommuteMiles(activeCommute) : null;
      matches = withDistance
        .filter((v) => maxMiles == null || v.distanceMiles <= maxMiles)
        .sort((a, b) => a.distanceMiles - b.distanceMiles);
    }
  }

  const { data: savedRows } = await supabase
    .from("applications")
    .select("vacancy_id")
    .eq("user_id", user.id);
  const savedIds = (savedRows ?? []).map((r) => r.vacancy_id);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Discover apprenticeships</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Matched on sector, commute radius from <strong>{profile.postcode}</strong>, and open
          closing dates.
        </p>
      </div>

      {params.error && <p className="text-sm text-destructive">{params.error}</p>}

      {geocodeFailed && (
        <p className="text-sm text-destructive">
          We couldn&apos;t locate the postcode on your profile ({profile.postcode}).{" "}
          <Link href="/onboarding" className="underline">
            Update it
          </Link>
          .
        </p>
      )}

      {profile.minimum_apprenticeship_level == null && activeLevel == null && (
        <p className="text-sm text-muted-foreground">
          You haven&apos;t set a minimum apprenticeship level, so results below aren&apos;t
          filtered by level unless you pick one below.
        </p>
      )}

      <DiscoveryFilters
        activeSectors={activeSectors}
        activeLevel={activeLevel}
        activeCommute={activeCommute}
        activeClosingWithin={activeClosingWithin}
        activeStartsBy={activeStartsBy}
      />

      {routes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No sectors selected currently map to a matchable category.{" "}
          <Link href="/onboarding" className="underline">
            Adjust your sectors of interest
          </Link>
          , or pick some above.
        </p>
      )}

      {!geocodeFailed && routes.length > 0 && matches.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No vacancies currently match these filters. Try widening the commute radius or clearing
          a filter.
        </p>
      )}

      <DiscoveryBoard
        matches={matches}
        savedIds={savedIds}
        saveVacancy={saveVacancy}
        getVacancyDetail={getVacancyDetail}
      />
    </main>
  );
}
