"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { saveOnboarding } from "./actions";
import {
  COMMUTE_OPTIONS,
  GRADE_OPTIONS,
  LEVEL_OPTIONS,
  SECTOR_OPTIONS,
  type SubjectRow,
} from "./constants";

type Props = {
  initialFullName: string;
  initialSchoolYear: string;
  initialSubjects: SubjectRow[];
  initialSectors: string[];
  initialPostcode: string;
  initialMaxCommuteMinutes: number | null;
  initialRightToWork: boolean | null;
  initialSecurityClearanceEligible: boolean | null;
  initialMinimumApprenticeshipLevel: number | null;
  error?: string;
  returnTo?: string;
};

const inputClass =
  "rounded-2xl border-2 border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-ring";
const ghostButtonClass =
  "rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:translate-y-px";
const legendClass = "mb-2 font-heading text-base font-bold text-foreground";
const fieldLabelClass = "font-bold text-foreground";

export default function OnboardingForm({
  initialFullName,
  initialSchoolYear,
  initialSubjects,
  initialSectors,
  initialPostcode,
  initialMaxCommuteMinutes,
  initialRightToWork,
  initialSecurityClearanceEligible,
  initialMinimumApprenticeshipLevel,
  error,
  returnTo,
}: Props) {
  const [subjects, setSubjects] = useState<SubjectRow[]>(
    initialSubjects.length > 0
      ? initialSubjects
      : [{ subject: "", grade: "", predictedGrade: "" }]
  );
  const reduceMotion = useReducedMotion();

  function updateSubject(index: number, patch: Partial<SubjectRow>) {
    setSubjects((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  }

  function addSubject() {
    setSubjects((rows) => [...rows, { subject: "", grade: "", predictedGrade: "" }]);
  }

  function removeSubject(index: number) {
    setSubjects((rows) => rows.filter((_, i) => i !== index));
  }

  const cleanSubjects = subjects
    .map((row) => ({ ...row, subject: row.subject.trim() }))
    .filter((row) => row.subject.length > 0);

  const subjectsJson = JSON.stringify(cleanSubjects.map((row) => row.subject));
  const gradesJson = JSON.stringify(
    Object.fromEntries(
      cleanSubjects.filter((row) => row.grade).map((row) => [row.subject, row.grade])
    )
  );
  const predictedGradesJson = JSON.stringify(
    Object.fromEntries(
      cleanSubjects
        .filter((row) => row.predictedGrade)
        .map((row) => [row.subject, row.predictedGrade])
    )
  );

  return (
    <form className="flex flex-col gap-8">
      <input type="hidden" name="return_to" value={returnTo ?? "/onboarding"} />
      <input type="hidden" name="subjects_json" value={subjectsJson} />
      <input type="hidden" name="grades_json" value={gradesJson} />
      <input type="hidden" name="predicted_grades_json" value={predictedGradesJson} />

      {error && (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}

      <div className="rounded-[24px_20px_26px_22px] border border-border bg-card p-6 shadow-[0_24px_42px_-30px_rgba(96,74,52,0.5)]">
      <div className={legendClass}>About you</div>
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={fieldLabelClass}>Full name</span>
          <input
            name="full_name"
            required
            defaultValue={initialFullName}
            className={inputClass}
            placeholder="e.g. Archie Richardson"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={fieldLabelClass}>School year</span>
          <input
            name="school_year"
            required
            defaultValue={initialSchoolYear}
            className={inputClass}
            placeholder="e.g. Year 13"
          />
        </label>
      </fieldset>
      </div>

      <div className="rounded-[24px_20px_26px_22px] border border-border bg-card p-6 shadow-[0_24px_42px_-30px_rgba(96,74,52,0.5)]">
      <fieldset className="flex flex-col gap-3">
        <legend className={legendClass}>Subjects & grades</legend>
        <AnimatePresence initial={false}>
          {subjects.map((row, index) => (
            <motion.div
              key={index}
              layout
              initial={reduceMotion ? false : { opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, height: 0, y: -4 }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end"
            >
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">Subject</span>
                <input
                  className={inputClass}
                  value={row.subject}
                  onChange={(e) => updateSubject(index, { subject: e.target.value })}
                  placeholder="e.g. Computer Science"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">
                  Predicted grade
                </span>
                <select
                  className={inputClass}
                  value={row.predictedGrade}
                  onChange={(e) =>
                    updateSubject(index, { predictedGrade: e.target.value })
                  }
                >
                  <option value="">—</option>
                  {GRADE_OPTIONS.filter((g) => g !== "U").map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">
                  Actual grade (if sat)
                </span>
                <select
                  className={inputClass}
                  value={row.grade}
                  onChange={(e) => updateSubject(index, { grade: e.target.value })}
                >
                  <option value="">Not yet sat</option>
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => removeSubject(index)}
                disabled={subjects.length === 1}
                className={`${ghostButtonClass} justify-self-start disabled:pointer-events-none disabled:opacity-40`}
                aria-label={`Remove subject ${row.subject || index + 1}`}
              >
                Remove
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        <button type="button" onClick={addSubject} className={`${ghostButtonClass} self-start`}>
          + Add subject
        </button>
      </fieldset>
      </div>

      <div className="rounded-[24px_20px_26px_22px] border border-border bg-card p-6 shadow-[0_24px_42px_-30px_rgba(96,74,52,0.5)]">
      <fieldset className="flex flex-col gap-2">
        <legend className={legendClass}>Sector interest</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2.5">
          {SECTOR_OPTIONS.map((sector) => (
            <label key={sector} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="sectors"
                value={sector}
                defaultChecked={initialSectors.includes(sector)}
                className="h-4 w-4 accent-[var(--warm-sage-foreground)]"
              />
              {sector}
            </label>
          ))}
        </div>
      </fieldset>
      </div>

      <div className="rounded-[24px_20px_26px_22px] border border-border bg-card p-6 shadow-[0_24px_42px_-30px_rgba(96,74,52,0.5)]">
      <div className={legendClass}>Location &amp; eligibility</div>
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={fieldLabelClass}>Postcode</span>
          <input
            name="postcode"
            required
            defaultValue={initialPostcode}
            className={inputClass}
            placeholder="e.g. SW1A 1AA"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={fieldLabelClass}>Max commute</span>
          <select
            name="max_commute_minutes"
            required
            defaultValue={initialMaxCommuteMinutes ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              Choose…
            </option>
            {COMMUTE_OPTIONS.map((mins) => (
              <option key={mins} value={mins}>
                {mins} minutes
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={fieldLabelClass}>Minimum apprenticeship level</span>
          <select
            name="minimum_apprenticeship_level"
            required
            defaultValue={initialMinimumApprenticeshipLevel ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              Choose…
            </option>
            {LEVEL_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className={legendClass}>Right to work in the UK</legend>
        <div className="flex gap-5 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="right_to_work"
              value="yes"
              defaultChecked={initialRightToWork === true}
              required
              className="h-4 w-4 accent-[var(--warm-sage-foreground)]"
            />
            Yes
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="right_to_work"
              value="no"
              defaultChecked={initialRightToWork === false}
              className="h-4 w-4 accent-[var(--warm-sage-foreground)]"
            />
            No
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className={legendClass}>Eligible for security clearance (SC/DV)?</legend>
        <div className="flex gap-5 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="security_clearance_eligible"
              value="yes"
              defaultChecked={initialSecurityClearanceEligible === true}
              className="h-4 w-4 accent-[var(--warm-sage-foreground)]"
            />
            Yes
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="security_clearance_eligible"
              value="no"
              defaultChecked={initialSecurityClearanceEligible === false}
              className="h-4 w-4 accent-[var(--warm-sage-foreground)]"
            />
            No
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="security_clearance_eligible"
              value="unsure"
              defaultChecked={
                initialSecurityClearanceEligible === null ||
                initialSecurityClearanceEligible === undefined
              }
              className="h-4 w-4 accent-[var(--warm-sage-foreground)]"
            />
            Not sure
          </label>
        </div>
      </fieldset>
      </div>

      <button
        type="submit"
        formAction={saveOnboarding}
        className="self-start rounded-2xl bg-primary px-5 py-3 text-base font-bold text-primary-foreground shadow-[0_4px_0_var(--shadow-accent)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
      >
        Save & continue
      </button>
    </form>
  );
}
