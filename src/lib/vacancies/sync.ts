import { createAdminClient } from "@/lib/supabase/admin";
import { fetchVacancyPage, type FaaVacancy } from "./faa-client";

// A single vacancy can list several locations (a national employer hiring
// the same role at multiple sites) -- confirmed against real synced data,
// not assumed: ~3.4% of vacancies carry more than one address, one as many
// as 10. Storing only addresses[0] silently hid every other site from a
// student who lives near one of those, not the first-listed one -- this is
// also why the public findapprenticeship.service.gov.uk result count runs
// consistently higher than this API's own totalFiltered figure: the public
// site shows one result per location, we were showing one per vacancy.
// One row per (vacancy, location) fixes this and matches the public site's
// own counting. Index 0 keeps the bare vacancyReference as external_id so
// existing single-location rows upsert in place rather than duplicate;
// only additional locations get a suffixed id.
function toVacancyRows(vacancy: FaaVacancy) {
  const addresses = vacancy.addresses?.length ? vacancy.addresses : [undefined];

  return addresses.map((address, index) => {
    const location = [address?.addressLine3, address?.addressLine4]
      .filter(Boolean)
      .join(", ");

    return {
      source: "gov_api" as const,
      external_id:
        index === 0 ? vacancy.vacancyReference : `${vacancy.vacancyReference}#${index}`,
      employer_name: vacancy.employerName,
      role_title: vacancy.title,
      apprenticeship_level: vacancy.course?.level ?? null,
      sector: vacancy.course?.route ? [vacancy.course.route] : [],
      standard_reference: vacancy.course?.larsCode
        ? String(vacancy.course.larsCode)
        : null,
      location: location || null,
      postcode: address?.postcode ?? null,
      latitude: address?.latitude ?? null,
      longitude: address?.longitude ?? null,
      closing_date: vacancy.closingDate?.slice(0, 10) ?? null,
      start_date: vacancy.startDate?.slice(0, 10) ?? null,
      apply_url: vacancy.vacancyUrl,
      description: vacancy.description,
      raw_json: vacancy,
      last_synced_at: new Date().toISOString(),
    };
  });
}

export type SyncSummary = {
  pagesFetched: number;
  vacanciesUpserted: number;
  totalAvailable: number;
};

export async function syncVacanciesFromFindAnApprenticeship(
  maxPages?: number
): Promise<SyncSummary> {
  const supabase = createAdminClient();

  let page = 1;
  let totalPages = 1;
  let totalAvailable = 0;
  let vacanciesUpserted = 0;

  do {
    const data = await fetchVacancyPage(page, 100);
    totalPages = data.totalPages;
    totalAvailable = data.total;

    const rows = data.vacancies.flatMap(toVacancyRows);
    if (rows.length > 0) {
      const { error } = await supabase
        .from("vacancies")
        .upsert(rows, { onConflict: "source,external_id" });
      if (error) {
        throw new Error(`Upsert failed on page ${page}: ${error.message}`);
      }
      vacanciesUpserted += rows.length;
    }

    page += 1;
    if (maxPages && page > maxPages) break;
    if (page <= totalPages) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  } while (page <= totalPages);

  return { pagesFetched: page - 1, vacanciesUpserted, totalAvailable };
}
