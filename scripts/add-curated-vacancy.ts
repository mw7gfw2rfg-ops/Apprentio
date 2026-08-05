#!/usr/bin/env bun
// Manually add/update a curated vacancy (source = 'curated'), linked to an
// existing employer_sources row. Not pretty — a JSON file in, an upsert out.
//
// Usage:
//   bun run vacancies:add-curated scripts/curated-vacancies/gchq-cyberfirst.json
//
// One file = one vacancy object, or an array of vacancy objects. Re-running
// with the same employer_name + role_title (or an explicit external_id)
// updates the existing row instead of duplicating it.
//
// Fields:
//   employer_name        required, must exactly match an employer_sources.employer_name
//   role_title           required
//   apprenticeship_level required, int 2-7
//   closing_date         required, YYYY-MM-DD
//   apply_url            required — the real employer application URL once it's live
//   sector               optional string[], using our onboarding sector names (e.g.
//                          "Cybersecurity", "Government & Defence" — see
//                          src/app/onboarding/constants.ts SECTOR_OPTIONS). Mapped
//                          through the same FAA-route vocabulary Discovery matches on
//                          (src/lib/vacancies/sector-mapping.ts) so curated rows are
//                          discoverable the same way synced ones are.
//   standard_reference    optional, e.g. "ST0409"
//   location              optional, free text
//   postcode              optional — if given, geocoded via postcodes.io so Discovery's
//                          commute-distance filter can include this vacancy
//   description           optional
//   external_id           optional, auto-derived from employer_name + role_title if omitted

import { readFileSync } from "node:fs";
import { createAdminClient } from "../src/lib/supabase/admin";
import { geocodePostcode } from "../src/lib/vacancies/geocode";
import { sectorsToFaaRoutes } from "../src/lib/vacancies/sector-mapping";

type CuratedVacancyInput = {
  employer_name: string;
  role_title: string;
  apprenticeship_level: number;
  closing_date: string;
  apply_url: string;
  sector?: string[];
  standard_reference?: string;
  location?: string;
  postcode?: string;
  description?: string;
  external_id?: string;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validate(input: unknown, index: number): CuratedVacancyInput {
  if (typeof input !== "object" || input === null) {
    throw new Error(`Entry ${index}: not an object`);
  }
  const v = input as Record<string, unknown>;
  const missing = ["employer_name", "role_title", "apprenticeship_level", "closing_date", "apply_url"]
    .filter((key) => v[key] === undefined || v[key] === null || v[key] === "");
  if (missing.length > 0) {
    throw new Error(`Entry ${index} (${v.role_title ?? "?"}): missing required field(s): ${missing.join(", ")}`);
  }
  const level = Number(v.apprenticeship_level);
  if (!Number.isInteger(level) || level < 2 || level > 7) {
    throw new Error(`Entry ${index}: apprenticeship_level must be an integer 2-7`);
  }
  return { ...v, apprenticeship_level: level } as CuratedVacancyInput;
}

async function main() {
  const paths = process.argv.slice(2);
  if (paths.length === 0) {
    throw new Error("Usage: bun run vacancies:add-curated <path-to-json> [more.json...]");
  }

  const supabase = createAdminClient();

  for (const path of paths) {
    const raw = JSON.parse(readFileSync(path, "utf-8"));
    const entries = Array.isArray(raw) ? raw : [raw];

    for (const [i, entry] of entries.entries()) {
      const input = validate(entry, i);

      const { data: employer, error: employerError } = await supabase
        .from("employer_sources")
        .select("id")
        .eq("employer_name", input.employer_name)
        .maybeSingle();

      if (employerError) {
        throw new Error(`Lookup failed for "${input.employer_name}": ${employerError.message}`);
      }
      if (!employer) {
        throw new Error(
          `"${input.employer_name}" not found in employer_sources — add it via seed-data first (bun run seed:employers), or fix the spelling.`
        );
      }

      let latitude: number | null = null;
      let longitude: number | null = null;
      if (input.postcode) {
        const coords = await geocodePostcode(input.postcode);
        if (coords) {
          latitude = coords.latitude;
          longitude = coords.longitude;
        } else {
          console.warn(`  Warning: couldn't geocode postcode "${input.postcode}" for ${input.role_title} — distance filtering won't include this vacancy.`);
        }
      }

      const external_id = input.external_id ?? slugify(`${input.employer_name}-${input.role_title}`);

      const mappedSector = sectorsToFaaRoutes(input.sector ?? []);
      if ((input.sector ?? []).length > 0 && mappedSector.length === 0) {
        console.warn(`  Warning: none of ${JSON.stringify(input.sector)} mapped to a matchable category for ${input.role_title} — check spelling against SECTOR_OPTIONS.`);
      }

      const row = {
        source: "curated" as const,
        external_id,
        employer_source_id: employer.id,
        employer_name: input.employer_name,
        role_title: input.role_title,
        apprenticeship_level: input.apprenticeship_level,
        sector: mappedSector,
        standard_reference: input.standard_reference ?? null,
        location: input.location ?? null,
        postcode: input.postcode ?? null,
        latitude,
        longitude,
        closing_date: input.closing_date,
        apply_url: input.apply_url,
        description: input.description ?? null,
        raw_json: input,
        last_synced_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("vacancies")
        .upsert(row, { onConflict: "source,external_id" });

      if (error) {
        throw new Error(`Upsert failed for "${input.role_title}": ${error.message}`);
      }

      console.log(`Upserted: ${input.employer_name} — ${input.role_title} (${external_id})`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
