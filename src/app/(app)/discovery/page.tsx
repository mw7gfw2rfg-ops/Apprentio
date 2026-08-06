import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { geocodePostcode } from "@/lib/vacancies/geocode";
import { haversineMiles, maxCommuteMiles } from "@/lib/vacancies/distance";
import { sectorsToFaaRoutes } from "@/lib/vacancies/sector-mapping";
import { Pill } from "@/components/vacancy-pill";
import { saveVacancy } from "./actions";

type VacancyRow = {
  id: string;
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
};

export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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

  const sectorsOfInterest = profile.sectors_of_interest ?? [];
  const routes = sectorsToFaaRoutes(sectorsOfInterest);
  const today = new Date().toISOString().slice(0, 10);

  let matches: (VacancyRow & { distanceMiles: number })[] = [];
  let geocodeFailed = false;

  if (routes.length > 0 && profile.postcode && profile.max_commute_minutes) {
    const coords = await geocodePostcode(profile.postcode);
    if (!coords) {
      geocodeFailed = true;
    } else {
      let vacanciesQuery = supabase
        .from("vacancies")
        .select(
          "id, employer_name, role_title, apprenticeship_level, sector, location, postcode, closing_date, start_date, latitude, longitude"
        )
        .gte("closing_date", today)
        .overlaps("sector", routes)
        .order("closing_date", { ascending: true });

      if (profile.minimum_apprenticeship_level != null) {
        vacanciesQuery = vacanciesQuery.gte(
          "apprenticeship_level",
          profile.minimum_apprenticeship_level
        );
      }

      const { data: vacancies } = await vacanciesQuery.returns<VacancyRow[]>();

      const maxMiles = maxCommuteMiles(profile.max_commute_minutes);
      matches = (vacancies ?? [])
        .filter((v) => v.latitude != null && v.longitude != null)
        .map((v) => ({
          ...v,
          distanceMiles: haversineMiles(
            coords.latitude,
            coords.longitude,
            v.latitude!,
            v.longitude!
          ),
        }))
        .filter((v) => v.distanceMiles <= maxMiles)
        .sort((a, b) => a.distanceMiles - b.distanceMiles);
    }
  }

  const { data: savedRows } = await supabase
    .from("applications")
    .select("vacancy_id")
    .eq("user_id", user.id);
  const savedIds = new Set((savedRows ?? []).map((r) => r.vacancy_id));

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Discover apprenticeships</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Matched on sector, commute radius from <strong>{profile.postcode}</strong>, and
          open closing dates.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {geocodeFailed && (
        <p className="text-sm text-red-600">
          We couldn&apos;t locate the postcode on your profile ({profile.postcode}).{" "}
          <Link href="/onboarding" className="underline">
            Update it
          </Link>
          .
        </p>
      )}

      {profile.minimum_apprenticeship_level == null && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          You haven&apos;t set a minimum apprenticeship level, so results below aren&apos;t
          filtered by level.{" "}
          <Link href="/onboarding" className="underline">
            Set one
          </Link>
          .
        </p>
      )}

      {routes.length === 0 && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          None of your sectors of interest currently map to a matchable category.
          <Link href="/onboarding" className="ml-1 underline">
            Adjust your sectors
          </Link>
          .
        </p>
      )}

      {!geocodeFailed && routes.length > 0 && matches.length === 0 && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No vacancies currently match your profile. Check back after the next sync.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {matches.map((vacancy) => {
          const isSaved = savedIds.has(vacancy.id);
          return (
            <li
              key={vacancy.id}
              className="relative rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
            >
              <Link href={`/vacancies/${vacancy.id}`} className="block pr-24">
                <h2 className="text-base font-semibold tracking-tight">
                  {vacancy.role_title}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {vacancy.employer_name}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill accent>{vacancy.distanceMiles.toFixed(1)} mi</Pill>
                  <Pill>Level {vacancy.apprenticeship_level ?? "—"}</Pill>
                  <Pill>{vacancy.location ?? vacancy.postcode ?? "—"}</Pill>
                  <Pill>Closes {vacancy.closing_date ?? "—"}</Pill>
                  <Pill>
                    {vacancy.start_date
                      ? `Starts ${vacancy.start_date}`
                      : "Start date not specified"}
                  </Pill>
                </div>
              </Link>
              <form className="absolute right-4 top-4 shrink-0">
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
            </li>
          );
        })}
      </ul>
    </main>
  );
}
