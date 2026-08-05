// Our onboarding sectors (src/app/onboarding/constants.ts) are a small curated
// list; the FAA API classifies vacancies by its own 15 "routes" (confirmed live
// via GET /vacancies/referencedata/courses/routes). The two vocabularies don't
// share strings, so matching needs an explicit mapping — this is a coarse,
// hand-picked approximation, not derived data. "Other" has no mapping: there's
// no controlled-vocabulary equivalent to match it against, so selecting only
// "Other" yields zero automatic sector matches by design.
export const SECTOR_TO_FAA_ROUTES: Record<string, string[]> = {
  Cybersecurity: ["Digital", "Protective services"],
  "Software Engineering": ["Digital"],
  "Data & AI": ["Digital"],
  "Finance & Professional Services": ["Legal, finance and accounting", "Business and administration"],
  Engineering: ["Engineering and manufacturing"],
  "Government & Defence": ["Protective services", "Business and administration"],
  Consulting: ["Business and administration"],
  Other: [],
};

export function sectorsToFaaRoutes(sectorsOfInterest: string[]): string[] {
  const routes = new Set<string>();
  for (const sector of sectorsOfInterest) {
    for (const route of SECTOR_TO_FAA_ROUTES[sector] ?? []) {
      routes.add(route);
    }
  }
  return [...routes];
}
