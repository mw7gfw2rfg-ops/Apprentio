"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMMUTE_OPTIONS, LEVEL_OPTIONS, SECTOR_OPTIONS } from "@/app/onboarding/constants";

const CLOSING_WITHIN_OPTIONS = [
  { value: "7", label: "Next 7 days" },
  { value: "30", label: "Next 30 days" },
  { value: "90", label: "Next 90 days" },
];

const ANY = "any";

export function DiscoveryFilters({
  activeSectors,
  activeLevel,
  activeCommute,
  activeClosingWithin,
  activeStartsBy,
}: {
  activeSectors: string[];
  activeLevel: number | null;
  activeCommute: number | null;
  activeClosingWithin: string | null;
  activeStartsBy: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Setting a param to the literal "any" (rather than deleting it) records
  // that the user explicitly cleared this filter -- distinct from the param
  // being absent, which falls back to the profile's own default. Without
  // that distinction, picking "Any level" on a profile with a minimum level
  // set would just snap straight back to the profile's value.
  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/discovery?${params.toString()}`, { scroll: false });
  }

  function toggleSector(sector: string) {
    const next = activeSectors.includes(sector)
      ? activeSectors.filter((s) => s !== sector)
      : [...activeSectors, sector];
    const params = new URLSearchParams(searchParams.toString());
    params.set("sectors", next.join(","));
    router.push(`/discovery?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3">
      <div className="flex flex-wrap gap-1.5">
        {SECTOR_OPTIONS.map((sector) => {
          const active = activeSectors.includes(sector);
          return (
            <Button
              key={sector}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => toggleSector(sector)}
              className="h-7 rounded-full px-3 text-xs"
            >
              {sector}
            </Button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Minimum level</Label>
          <Select
            value={activeLevel != null ? String(activeLevel) : ANY}
            onValueChange={(value) => updateParam("level", value)}
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any level</SelectItem>
              {LEVEL_OPTIONS.map((level) => (
                <SelectItem key={level.value} value={String(level.value)}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Commute radius</Label>
          <Select
            value={activeCommute != null ? String(activeCommute) : ANY}
            onValueChange={(value) => updateParam("commute", value)}
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any distance</SelectItem>
              {COMMUTE_OPTIONS.map((minutes) => (
                <SelectItem key={minutes} value={String(minutes)}>
                  Within {minutes} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Closing</Label>
          <Select
            value={activeClosingWithin ?? ANY}
            onValueChange={(value) => updateParam("closing_within", value)}
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any time</SelectItem>
              {CLOSING_WITHIN_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="starts-by" className="text-xs text-muted-foreground">
            Starts by
          </Label>
          <Input
            id="starts-by"
            type="date"
            defaultValue={activeStartsBy ?? ""}
            onChange={(e) => updateParam("starts_by", e.target.value || null)}
            className="h-7 w-40 text-xs"
          />
        </div>

        {(activeLevel != null ||
          activeCommute != null ||
          activeClosingWithin != null ||
          activeStartsBy != null) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => router.push("/discovery", { scroll: false })}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
