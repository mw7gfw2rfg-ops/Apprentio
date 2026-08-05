import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { geocodePostcode } from "@/lib/vacancies/geocode";
import { haversineMiles, maxCommuteMiles } from "@/lib/vacancies/distance";
import { sectorsToFaaRoutes } from "@/lib/vacancies/sector-mapping";
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
  apply_url: string | null;
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
          "id, employer_name, role_title, apprenticeship_level, sector, location, postcode, closing_date, apply_url, latitude, longitude"
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
        <h1 className="text-2xl font-semibold">Discover apprenticeships</h1>
        <p className="text-sm text-neutral-500">
          Matched on sector, commute radius from {profile.postcode}, and open closing
          dates.
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
        <p className="text-sm text-neutral-500">
          You haven&apos;t set a minimum apprenticeship level, so results below aren&apos;t
          filtered by level.{" "}
          <Link href="/onboarding" className="underline">
            Set one
          </Link>
          .
        </p>
      )}

      {routes.length === 0 && (
        <p className="text-sm text-neutral-500">
          None of your sectors of interest currently map to a matchable category.
          <Link href="/onboarding" className="ml-1 underline">
            Adjust your sectors
          </Link>
          .
        </p>
      )}

      {!geocodeFailed && routes.length > 0 && matches.length === 0 && (
        <p className="text-sm text-neutral-500">
          No vacancies currently match your profile. Check back after the next sync.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {matches.map((vacancy) => {
          const isSaved = savedIds.has(vacancy.id);
          return (
            <li key={vacancy.id} className="rounded border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium">{vacancy.role_title}</h2>
                  <p className="text-sm text-neutral-500">{vacancy.employer_name}</p>
                </div>
                <form>
                  <input type="hidden" name="vacancy_id" value={vacancy.id} />
                  <button
                    formAction={saveVacancy}
                    disabled={isSaved}
                    className="rounded border px-3 py-1.5 text-sm transition-transform active:scale-[0.97] disabled:opacity-50"
                  >
                    {isSaved ? "Saved" : "Save"}
                  </button>
                </form>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-neutral-600 sm:grid-cols-4">
                <div>
                  <dt className="text-xs uppercase text-neutral-400">Level</dt>
                  <dd>{vacancy.apprenticeship_level ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-neutral-400">Distance</dt>
                  <dd>{vacancy.distanceMiles.toFixed(1)} mi</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-neutral-400">Location</dt>
                  <dd>{vacancy.location ?? vacancy.postcode ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-neutral-400">Closes</dt>
                  <dd>{vacancy.closing_date ?? "—"}</dd>
                </div>
              </dl>
              {vacancy.apply_url && (
                <a
                  href={vacancy.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm underline"
                >
                  View on Find an Apprenticeship
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
