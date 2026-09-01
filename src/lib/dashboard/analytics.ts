import { geocodePostcode } from "@/lib/vacancies/geocode";
import { haversineMiles } from "@/lib/vacancies/distance";
import { getBaseCvText } from "@/lib/matching/cv-text-cache";
import { extractVacancyKeywords, prepareCvForMatching, scoreMatch } from "@/lib/matching/match-score";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type VacancyJoin = {
  role_title: string;
  employer_name: string;
  sector: string[] | null;
  apprenticeship_level: number | null;
  latitude: number | null;
  longitude: number | null;
  closing_date: string | null;
  description: string | null;
  raw_json: unknown;
  source: "gov_api" | "curated";
};

type ApplicationRow = {
  id: string;
  stage: string;
  submitted_at: string | null;
  manual_employer_name: string | null;
  manual_role_title: string | null;
  manual_closing_date: string | null;
  vacancy_id: string | null;
  vacancies: VacancyJoin | null;
};

export type SectorRow = { sector: string; count: number; pct: number };
export type LevelRow = { level: number; count: number; pct: number };
export type UpcomingDeadline = { role: string; employer: string; closesInDays: number };
export type HeatmapCell = { date: string; sentCount: number; repliedCount: number; future: boolean };

export type ApplicationAnalytics = {
  hasData: boolean;
  avgMatch: number | null;
  matchedCount: number;
  sectorRows: SectorRow[];
  levelRows: LevelRow[];
  avgDistance: number | null;
  minDistance: number | null;
  maxDistance: number | null;
  upcomingDeadlines: UpcomingDeadline[];
  activityHeatmap: HeatmapCell[];
};

// Excludes stages where the closing-date countdown is no longer a live
// action item for the student -- they've already submitted, so a closing
// date passing doesn't need their attention anymore.
const OPEN_STAGES = new Set(["saved", "drafting", "ready_for_review", "approved"]);
// "Replied" is a real employer decision recorded via a board/status-change
// action, not a guess -- these are the only stage transitions that mean the
// employer actually got back to the student.
const REPLY_STAGES = new Set(["interview", "offer", "rejected"]);
const HEATMAP_DAYS = 84; // 12 weeks

function daysUntil(dateStr: string, today: Date): number {
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export async function computeApplicationAnalytics(
  supabase: SupabaseClient,
  userId: string,
  profile: { postcode: string | null; base_cv_storage_path: string | null; base_cv_extracted_text: string | null }
): Promise<ApplicationAnalytics> {
  const { data: rawApplications } = await supabase
    .from("applications")
    .select(
      "id, stage, submitted_at, manual_employer_name, manual_role_title, manual_closing_date, vacancy_id, vacancies(role_title, employer_name, sector, apprenticeship_level, latitude, longitude, closing_date, description, raw_json, source)"
    )
    .eq("user_id", userId);

  const applications = (rawApplications ?? []) as unknown as ApplicationRow[];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (applications.length === 0) {
    return {
      hasData: false,
      avgMatch: null,
      matchedCount: 0,
      sectorRows: [],
      levelRows: [],
      avgDistance: null,
      minDistance: null,
      maxDistance: null,
      upcomingDeadlines: [],
      activityHeatmap: buildHeatmap(today, new Map(), new Map()),
    };
  }

  // Sector / level mix -- vacancy-backed applications only, manual entries
  // have no vacancy row to derive these from.
  const sectorTally = new Map<string, number>();
  const levelTally = new Map<number, number>();
  for (const app of applications) {
    const v = app.vacancies;
    if (!v) continue;
    const primarySector = v.sector?.[0];
    if (primarySector) sectorTally.set(primarySector, (sectorTally.get(primarySector) ?? 0) + 1);
    if (typeof v.apprenticeship_level === "number") {
      levelTally.set(v.apprenticeship_level, (levelTally.get(v.apprenticeship_level) ?? 0) + 1);
    }
  }
  const maxSector = Math.max(1, ...sectorTally.values());
  const sectorRows: SectorRow[] = [...sectorTally.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([sector, count]) => ({ sector, count, pct: Math.round((count / maxSector) * 100) }));
  const maxLevel = Math.max(1, ...levelTally.values());
  const levelRows: LevelRow[] = [...levelTally.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, count]) => ({ level, count, pct: Math.round((count / maxLevel) * 100) }));

  // Commute distance -- vacancies already store lat/lon from ingestion, so
  // this only needs one geocode call for the student's own postcode, not
  // one per vacancy.
  const homeCoords = profile.postcode ? await geocodePostcode(profile.postcode) : null;
  const distances: number[] = [];
  if (homeCoords) {
    for (const app of applications) {
      const v = app.vacancies;
      if (v?.latitude != null && v?.longitude != null) {
        distances.push(haversineMiles(homeCoords.latitude, homeCoords.longitude, v.latitude, v.longitude));
      }
    }
  }
  const avgDistance = distances.length
    ? Math.round(distances.reduce((sum, d) => sum + d, 0) / distances.length)
    : null;
  const minDistance = distances.length ? Math.round(Math.min(...distances)) : null;
  const maxDistance = distances.length ? Math.round(Math.max(...distances)) : null;

  // Match score -- reuses the same free-tier, no-AI-call scoring already
  // shown on Discovery/vacancy-detail, run once per vacancy-backed
  // application against the student's cached base CV text.
  const cvText = await getBaseCvText(
    supabase,
    userId,
    profile.base_cv_storage_path,
    profile.base_cv_extracted_text
  );
  let avgMatch: number | null = null;
  let matchedCount = 0;
  if (cvText) {
    const prepared = prepareCvForMatching(cvText);
    const scores: number[] = [];
    for (const app of applications) {
      const v = app.vacancies;
      if (!v) continue;
      const keywords = extractVacancyKeywords({ source: v.source, rawJson: v.raw_json, description: v.description });
      const result = scoreMatch(prepared, keywords);
      if (result) scores.push(result.percent);
    }
    matchedCount = scores.length;
    if (scores.length) {
      avgMatch = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
    }
  }

  // Closing soon -- only applications still awaiting the student's own next
  // action, ranked by real closing date, vacancy-backed or manual alike.
  const upcomingDeadlines: UpcomingDeadline[] = applications
    .filter((app) => OPEN_STAGES.has(app.stage))
    .map((app) => {
      const closingDate = app.vacancies?.closing_date ?? app.manual_closing_date;
      const role = app.vacancies?.role_title ?? app.manual_role_title ?? "Untitled role";
      const employer = app.vacancies?.employer_name ?? app.manual_employer_name ?? "Unknown employer";
      if (!closingDate) return null;
      const closesInDays = daysUntil(closingDate, today);
      if (closesInDays < 0) return null;
      return { role, employer, closesInDays };
    })
    .filter((d): d is UpcomingDeadline => d !== null)
    .sort((a, b) => a.closesInDays - b.closesInDays)
    .slice(0, 3);

  // Activity heatmap -- "sent" is the real submitted_at timestamp (the
  // moment the student told Apprentio they submitted to the employer, not
  // just saved a vacancy); "replied" is a real employer-response stage
  // transition read from the application_events audit trail.
  const sentByDate = new Map<string, number>();
  for (const app of applications) {
    if (!app.submitted_at) continue;
    const key = app.submitted_at.slice(0, 10);
    sentByDate.set(key, (sentByDate.get(key) ?? 0) + 1);
  }

  const applicationIds = applications.map((a) => a.id);
  const repliedByDate = new Map<string, number>();
  if (applicationIds.length > 0) {
    const { data: events } = await supabase
      .from("application_events")
      .select("application_id, created_at, event_type, payload")
      .eq("event_type", "status_changed")
      .in("application_id", applicationIds);

    for (const event of events ?? []) {
      const toStage = (event.payload as { to_stage?: string } | null)?.to_stage;
      if (!toStage || !REPLY_STAGES.has(toStage)) continue;
      const key = (event.created_at as string).slice(0, 10);
      repliedByDate.set(key, (repliedByDate.get(key) ?? 0) + 1);
    }
  }

  return {
    hasData: true,
    avgMatch,
    matchedCount,
    sectorRows,
    levelRows,
    avgDistance,
    minDistance,
    maxDistance,
    upcomingDeadlines,
    activityHeatmap: buildHeatmap(today, sentByDate, repliedByDate),
  };
}

function buildHeatmap(
  today: Date,
  sentByDate: Map<string, number>,
  repliedByDate: Map<string, number>
): HeatmapCell[] {
  const msDay = 86_400_000;
  const startWindow = new Date(today.getTime() - (HEATMAP_DAYS - 1) * msDay);
  // Align to a Monday grid start so week columns are consistent.
  const gridStart = new Date(startWindow.getTime() - ((startWindow.getDay() + 6) % 7) * msDay);
  const gridEnd = new Date(today.getTime() + (6 - ((today.getDay() + 6) % 7)) * msDay);
  const totalDays = Math.round((gridEnd.getTime() - gridStart.getTime()) / msDay) + 1;

  const cells: HeatmapCell[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(gridStart.getTime() + i * msDay);
    const key = d.toISOString().slice(0, 10);
    const future = d.getTime() > today.getTime();
    cells.push({
      date: key,
      sentCount: future ? 0 : sentByDate.get(key) ?? 0,
      repliedCount: future ? 0 : repliedByDate.get(key) ?? 0,
      future,
    });
  }
  return cells;
}
