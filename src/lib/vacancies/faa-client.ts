const BASE_URL = "https://api.apprenticeships.education.gov.uk/vacancies";

export type FaaAddress = {
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
};

export type FaaWage = {
  wageType?: string;
  wageUnit?: string;
  workingWeekDescription?: string;
  wageAdditionalInformation?: string;
};

export type FaaQualification = {
  subject?: string;
  grade?: string;
  weighting?: string;
  qualificationType?: string;
};

// Full field set confirmed against real synced raw_json (2026-08-06), not
// just the API docs — see vacancies table raw_json for a live example.
export type FaaVacancy = {
  title: string;
  description: string;
  fullDescription?: string;
  closingDate: string;
  startDate: string;
  postedDate?: string;
  addresses: FaaAddress[];
  employerName: string;
  employerDescription?: string;
  course: {
    larsCode: number;
    title: string;
    level: number;
    route: string;
    type: string;
  };
  apprenticeshipLevel: string;
  vacancyUrl: string;
  vacancyReference: string;
  wage?: FaaWage;
  hoursPerWeek?: number;
  expectedDuration?: string;
  numberOfPositions?: number;
  qualifications?: FaaQualification[];
  skills?: string[];
  trainingDescription?: string;
  outcomeDescription?: string;
  providerName?: string;
  ukprn?: number;
  isDisabilityConfident?: boolean;
  isNationalVacancy?: boolean;
};

export type FaaVacancyPage = {
  vacancies: FaaVacancy[];
  total: number;
  totalFiltered: number;
  totalPages: number;
};

export async function fetchVacancyPage(
  pageNumber: number,
  pageSize = 100
): Promise<FaaVacancyPage> {
  const subscriptionKey = process.env.FAA_API_SUBSCRIPTION_KEY;
  if (!subscriptionKey) {
    throw new Error("FAA_API_SUBSCRIPTION_KEY is not set");
  }

  const url = new URL(`${BASE_URL}/vacancy`);
  url.searchParams.set("PageNumber", String(pageNumber));
  url.searchParams.set("PageSize", String(pageSize));
  url.searchParams.set("IncludeDetails", "true");
  url.searchParams.set("Sort", "AgeDesc");

  const res = await fetch(url, {
    headers: {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "X-Version": "2",
    },
  });

  if (!res.ok) {
    throw new Error(
      `Find an Apprenticeship API request failed: ${res.status} ${await res.text()}`
    );
  }

  return res.json();
}
