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

export type FaaVacancy = {
  title: string;
  description: string;
  closingDate: string;
  startDate: string;
  addresses: FaaAddress[];
  employerName: string;
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
