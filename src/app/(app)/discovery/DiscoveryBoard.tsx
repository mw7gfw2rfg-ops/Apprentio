"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VacancyDetailContent } from "@/components/vacancy-detail-content";
import { useDesktopSplitPane } from "@/hooks/use-desktop-split-pane";
import type { VacancyDetail } from "@/lib/vacancies/detail";
import type { EmployerResearch } from "@/lib/drafting/employer-research";

export type VacancyMatch = {
  id: string;
  employer_name: string;
  role_title: string;
  apprenticeship_level: number | null;
  location: string | null;
  postcode: string | null;
  closing_date: string | null;
  start_date: string | null;
  distanceMiles: number;
  gradeSignal: string | null;
};

type VacancyDetailResult = {
  vacancy: VacancyDetail;
  isSaved: boolean;
  employerResearch: EmployerResearch | null;
};

export function DiscoveryBoard({
  matches,
  savedIds,
  saveVacancy,
  getVacancyDetail,
}: {
  matches: VacancyMatch[];
  savedIds: string[];
  saveVacancy: (formData: FormData) => void | Promise<void>;
  getVacancyDetail: (id: string) => Promise<VacancyDetailResult | null>;
}) {
  const isDesktop = useDesktopSplitPane();
  const savedSet = new Set(savedIds);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<VacancyDetailResult | null>(null);
  const [isPending, startTransition] = useTransition();

  // A filter change can drop the selected vacancy from the visible list --
  // derived during render (not an effect) so a stale selection never
  // flashes before being cleared: it just never renders in the first place.
  const effectiveSelectedId =
    selectedId && matches.some((m) => m.id === selectedId) ? selectedId : null;

  function handleSelect(id: string) {
    setSelectedId(id);
    setSelectedResult(null);
    startTransition(async () => {
      const result = await getVacancyDetail(id);
      setSelectedResult(result);
    });
  }

  return (
    <div className="lg:grid lg:grid-cols-[380px_1fr] lg:items-start lg:gap-6">
      <ul className="flex flex-col gap-2">
        {matches.map((vacancy) => {
          const isSaved = savedSet.has(vacancy.id);
          const isActive = isDesktop && effectiveSelectedId === vacancy.id;
          return (
            <li key={vacancy.id} className="relative">
              <Link
                href={`/vacancies/${vacancy.id}`}
                onClick={(e) => {
                  if (!isDesktop) return;
                  e.preventDefault();
                  handleSelect(vacancy.id);
                }}
                className={`block rounded-xl border p-3 pr-20 text-sm transition-colors ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <p className="truncate pr-1 font-medium leading-snug">{vacancy.role_title}</p>
                <p className="truncate text-xs text-muted-foreground">{vacancy.employer_name}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="default">{vacancy.distanceMiles.toFixed(1)} mi</Badge>
                  <Badge variant="outline">Level {vacancy.apprenticeship_level ?? "—"}</Badge>
                  <Badge variant="outline">Closes {vacancy.closing_date ?? "—"}</Badge>
                  {vacancy.gradeSignal && <Badge variant="secondary">{vacancy.gradeSignal}</Badge>}
                </div>
              </Link>
              <form className="absolute right-3 top-3">
                <input type="hidden" name="vacancy_id" value={vacancy.id} />
                <Button
                  type="submit"
                  formAction={saveVacancy}
                  disabled={isSaved}
                  size="sm"
                  variant={isSaved ? "outline" : "default"}
                  className="h-7 px-2.5 text-xs"
                >
                  {isSaved ? "✓ Saved" : "Save"}
                </Button>
              </form>
            </li>
          );
        })}
      </ul>

      {isDesktop && (
        <div className="sticky top-[4.5rem] hidden max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border bg-card p-6 lg:block">
          {!effectiveSelectedId && (
            <p className="text-sm text-muted-foreground">
              Select a vacancy from the list to see full details here.
            </p>
          )}
          {effectiveSelectedId && isPending && !selectedResult && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
          {effectiveSelectedId && selectedResult && (
            <VacancyDetailContent
              vacancy={selectedResult.vacancy}
              isSaved={selectedResult.isSaved}
              employerResearch={selectedResult.employerResearch}
              saveAction={async (formData) => {
                await saveVacancy(formData);
                setSelectedResult((prev) => (prev ? { ...prev, isSaved: true } : prev));
              }}
            />
          )}
          {effectiveSelectedId && !isPending && !selectedResult && (
            <p className="text-sm text-destructive">Couldn&apos;t load this vacancy.</p>
          )}
        </div>
      )}
    </div>
  );
}
