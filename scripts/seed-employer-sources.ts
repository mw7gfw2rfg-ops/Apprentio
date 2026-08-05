#!/usr/bin/env bun
// Parses seed-data/employer-sources-seed.md's WAVE 1/2/3 target tables and
// upserts them into employer_sources. Re-run whenever the seed doc is refreshed
// from the agenticos vault — matched on employer_name.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createAdminClient } from "../src/lib/supabase/admin";

const SEED_PATH = join(import.meta.dirname, "..", "seed-data", "employer-sources-seed.md");

type EmployerSourceRow = {
  employer_name: string;
  portal_url: string | null;
  portal_type: "direct" | "ucas" | "findapprenticeship" | null;
  verified_level: string;
  notes: string;
  last_verified_at: string;
};

function derivePortalType(
  platform: string
): EmployerSourceRow["portal_type"] {
  const p = platform.toLowerCase();
  if (p.includes("direct")) return "direct";
  if (p.includes("findapprenticeship")) return "findapprenticeship";
  if (p.includes("ucas")) return "ucas";
  return null;
}

function parseWaveTables(markdown: string): EmployerSourceRow[] {
  const verifiedMatch = markdown.match(/L6 Verification:\s*(\d{4}-\d{2}-\d{2})/);
  const lastVerifiedAt = verifiedMatch
    ? new Date(`${verifiedMatch[1]}T00:00:00Z`).toISOString()
    : new Date().toISOString();

  const lines = markdown.split("\n");
  const rows: EmployerSourceRow[] = [];
  let inWaveSection = false;

  for (const line of lines) {
    if (/^##\s+WAVE\s+\d/i.test(line)) {
      inWaveSection = true;
      continue;
    }
    if (/^##\s+/.test(line) && !/^##\s+WAVE\s+\d/i.test(line)) {
      inWaveSection = false;
      continue;
    }
    if (!inWaveSection || !line.trim().startsWith("|")) continue;

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 8) continue;

    const [rowNum, employer, role, level, platform, location, priority, notes] = cells;
    if (!/^\d+$/.test(rowNum)) continue; // skip header + separator rows

    rows.push({
      employer_name: employer,
      portal_url: null,
      portal_type: derivePortalType(platform),
      verified_level: level,
      notes: [
        role && `Role: ${role}`,
        location && `Location: ${location}`,
        priority && `Priority: ${priority}`,
        notes,
      ]
        .filter(Boolean)
        .join(" | "),
      last_verified_at: lastVerifiedAt,
    });
  }

  return rows;
}

async function main() {
  const markdown = readFileSync(SEED_PATH, "utf-8");
  const rows = parseWaveTables(markdown);

  if (rows.length === 0) {
    throw new Error("Parsed 0 employer rows from seed-data — check the markdown format");
  }

  const supabase = createAdminClient();
  const { error, data } = await supabase
    .from("employer_sources")
    .upsert(rows, { onConflict: "employer_name" })
    .select("employer_name");

  if (error) {
    throw new Error(`Upsert failed: ${error.message}`);
  }

  console.log(`Seeded ${data?.length ?? 0} employer_sources rows:`);
  for (const row of data ?? []) {
    console.log(` - ${row.employer_name}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
