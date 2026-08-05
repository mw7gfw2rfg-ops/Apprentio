import { createAdminClient } from "@/lib/supabase/admin";
import { fetchVacancyPage, type FaaVacancy } from "./faa-client";

function toVacancyRow(vacancy: FaaVacancy) {
  const address = vacancy.addresses?.[0];
  const location = [address?.addressLine3, address?.addressLine4]
    .filter(Boolean)
    .join(", ");

  return {
    source: "gov_api" as const,
    external_id: vacancy.vacancyReference,
    employer_name: vacancy.employerName,
    role_title: vacancy.title,
    apprenticeship_level: vacancy.course?.level ?? null,
    sector: vacancy.course?.route ? [vacancy.course.route] : [],
    standard_reference: vacancy.course?.larsCode
      ? String(vacancy.course.larsCode)
      : null,
    location: location || null,
    postcode: address?.postcode ?? null,
    closing_date: vacancy.closingDate?.slice(0, 10) ?? null,
    apply_url: vacancy.vacancyUrl,
    description: vacancy.description,
    raw_json: vacancy,
    last_synced_at: new Date().toISOString(),
  };
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

    const rows = data.vacancies.map(toVacancyRow);
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
