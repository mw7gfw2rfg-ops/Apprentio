#!/usr/bin/env bun
// Manually add/update a curated vacancy (source = 'curated'), linked to an
// existing employer_sources row. Not pretty — a JSON file in, an upsert out.
// Same logic as the "Add curated vacancy" form on /admin (src/lib/vacancies/curated.ts)
// — this is the batch/JSON-file path, the admin form is the one-off/no-terminal path.
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
import { upsertCuratedVacancy, validateCuratedVacancyInput } from "../src/lib/vacancies/curated";

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
      const input = validateCuratedVacancyInput(entry, `Entry ${i}`);
      const result = await upsertCuratedVacancy(supabase, input);

      if (!result.ok) {
        throw new Error(`${input.role_title}: ${result.error}`);
      }
      for (const warning of result.warnings) {
        console.warn(`  Warning (${input.role_title}): ${warning}`);
      }
      console.log(`Upserted: ${input.employer_name} — ${input.role_title} (${result.externalId})`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
