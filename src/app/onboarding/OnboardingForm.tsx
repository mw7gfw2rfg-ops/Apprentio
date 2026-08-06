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
};

const inputClass =
  "rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-neutral-800 dark:bg-neutral-900 dark:focus:border-indigo-400";
const ghostButtonClass =
  "rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-all hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.97] dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900";
const legendClass =
  "mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400";
const fieldLabelClass = "font-medium text-neutral-700 dark:text-neutral-300";

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
      <input type="hidden" name="subjects_json" value={subjectsJson} />
      <input type="hidden" name="grades_json" value={gradesJson} />
      <input type="hidden" name="predicted_grades_json" value={predictedGradesJson} />

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <fieldset className="flex flex-wrap gap-4">
        <label className="flex flex-1 min-w-[10rem] flex-col gap-1.5 text-sm">
          <span className={fieldLabelClass}>Full name</span>
          <input
            name="full_name"
            required
            defaultValue={initialFullName}
            className={inputClass}
            placeholder="e.g. Archie Richardson"
          />
        </label>
        <label className="flex flex-1 min-w-[10rem] flex-col gap-1.5 text-sm">
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
              className="flex flex-wrap items-end gap-2"
            >
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-neutral-500 dark:text-neutral-400">Subject</span>
                <input
                  className={inputClass}
                  value={row.subject}
                  onChange={(e) => updateSubject(index, { subject: e.target.value })}
                  placeholder="e.g. Computer Science"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-neutral-500 dark:text-neutral-400">
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
                <span className="text-neutral-500 dark:text-neutral-400">
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
                className={`${ghostButtonClass} disabled:pointer-events-none disabled:opacity-40`}
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
                className="h-4 w-4 accent-indigo-600"
              />
              {sector}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-wrap gap-4">
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
              className="h-4 w-4 accent-indigo-600"
            />
            Yes
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="right_to_work"
              value="no"
              defaultChecked={initialRightToWork === false}
              className="h-4 w-4 accent-indigo-600"
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
              className="h-4 w-4 accent-indigo-600"
            />
            Yes
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="security_clearance_eligible"
              value="no"
              defaultChecked={initialSecurityClearanceEligible === false}
              className="h-4 w-4 accent-indigo-600"
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
              className="h-4 w-4 accent-indigo-600"
            />
            Not sure
          </label>
        </div>
      </fieldset>

      <button
        formAction={saveOnboarding}
        className="self-start rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        Save & continue
      </button>
    </form>
  );
}
