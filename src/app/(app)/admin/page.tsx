import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { SECTOR_OPTIONS } from "@/app/onboarding/constants";
import { addCuratedVacancy, addEmployerSource, updateEmployerSource } from "./actions";

const PORTAL_TYPE_OPTIONS = ["direct", "ucas", "findapprenticeship"] as const;
const LEVEL_OPTIONS = [2, 3, 4, 5, 6, 7] as const;

type EmployerSource = {
  id: string;
  employer_name: string;
  portal_url: string | null;
  portal_type: string | null;
  verified_level: string | null;
  notes: string | null;
  last_verified_at: string | null;
};

const inputClass = "rounded border px-2 py-1 text-sm";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    redirect("/login");
  }

  const { data: employers } = await supabase
    .from("employer_sources")
    .select("id, employer_name, portal_url, portal_type, verified_level, notes, last_verified_at")
    .order("employer_name")
    .returns<EmployerSource[]>();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">employer_sources and curated vacancies.</p>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Employers ({employers?.length ?? 0})</h2>
        <div className="flex flex-col gap-3">
          {(employers ?? []).map((employer) => (
            <form
              key={employer.id}
              className="grid grid-cols-1 gap-2 rounded border p-3 text-sm sm:grid-cols-2"
            >
              <input type="hidden" name="id" value={employer.id} />
              <label className="flex flex-col gap-1">
                Name
                <input
                  name="employer_name"
                  defaultValue={employer.employer_name}
                  required
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1">
                Portal type
                <select
                  name="portal_type"
                  defaultValue={employer.portal_type ?? ""}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {PORTAL_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                Portal URL
                <input
                  name="portal_url"
                  type="url"
                  defaultValue={employer.portal_url ?? ""}
                  placeholder="https://…"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1">
                Verified level
                <input
                  name="verified_level"
                  defaultValue={employer.verified_level ?? ""}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>
                  Last verified{" "}
                  {employer.last_verified_at && (
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                      ({new Date(employer.last_verified_at).toLocaleDateString()})
                    </span>
                  )}
                </span>
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                Notes
                <textarea
                  name="notes"
                  defaultValue={employer.notes ?? ""}
                  rows={2}
                  className={inputClass}
                />
              </label>
              <button
                formAction={updateEmployerSource}
                className="self-start rounded border px-3 py-1.5 text-sm transition-transform active:scale-[0.97] sm:col-span-2"
              >
                Save
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t pt-6">
        <h2 className="text-lg font-medium">Add employer</h2>
        <form className="grid grid-cols-1 gap-2 rounded border p-3 text-sm sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            Name
            <input name="employer_name" required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            Portal type
            <select name="portal_type" defaultValue="" className={inputClass}>
              <option value="">—</option>
              {PORTAL_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            Portal URL
            <input name="portal_url" type="url" placeholder="https://…" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            Verified level
            <input name="verified_level" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            Notes
            <textarea name="notes" rows={2} className={inputClass} />
          </label>
          <button
            formAction={addEmployerSource}
            className="self-start rounded bg-black px-3 py-1.5 text-sm text-white transition-transform active:scale-[0.97] dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300 sm:col-span-2"
          >
            Add employer
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3 border-t pt-6">
        <h2 className="text-lg font-medium">Add curated vacancy</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          For employers who post directly rather than via the Find an Apprenticeship API
          — e.g. GCHQ once its window opens.
        </p>
        <form className="grid grid-cols-1 gap-3 rounded border p-3 text-sm sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            Employer
            <select name="employer_name" required className={inputClass}>
              <option value="">Choose…</option>
              {(employers ?? []).map((e) => (
                <option key={e.id} value={e.employer_name}>
                  {e.employer_name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Role title
            <input name="role_title" required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            Level
            <select name="apprenticeship_level" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Choose…
              </option>
              {LEVEL_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  Level {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Closing date
            <input name="closing_date" type="date" required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            Start date
            <input name="start_date" type="date" className={inputClass} />
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              Leave blank if not yet announced.
            </span>
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            Apply URL
            <input name="apply_url" type="url" required placeholder="https://…" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            Standard reference
            <input name="standard_reference" placeholder="e.g. ST0409" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            Location
            <input name="location" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            Postcode
            <input name="postcode" placeholder="for commute-distance matching" className={inputClass} />
          </label>
          <fieldset className="flex flex-col gap-1 sm:col-span-2">
            <legend>Sector</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {SECTOR_OPTIONS.map((sector) => (
                <label key={sector} className="flex items-center gap-1 text-sm">
                  <input type="checkbox" name="sector" value={sector} />
                  {sector}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex flex-col gap-1 sm:col-span-2">
            Description
            <textarea name="description" rows={3} className={inputClass} />
          </label>
          <button
            formAction={addCuratedVacancy}
            className="self-start rounded bg-black px-3 py-1.5 text-sm text-white transition-transform active:scale-[0.97] dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300 sm:col-span-2"
          >
            Add curated vacancy
          </button>
        </form>
      </section>
    </main>
  );
}
