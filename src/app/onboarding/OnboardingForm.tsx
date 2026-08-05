"use client";

import { useState } from "react";
import { saveOnboarding } from "./actions";
import {
  COMMUTE_OPTIONS,
  GRADE_OPTIONS,
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
  error?: string;
};

const inputClass = "rounded border px-3 py-2 text-sm";
const buttonClass =
  "rounded border px-3 py-2 text-sm transition-transform active:scale-[0.97]";

export default function OnboardingForm({
  initialFullName,
  initialSchoolYear,
  initialSubjects,
  initialSectors,
  initialPostcode,
  initialMaxCommuteMinutes,
  initialRightToWork,
  initialSecurityClearanceEligible,
  error,
}: Props) {
  const [subjects, setSubjects] = useState<SubjectRow[]>(
    initialSubjects.length > 0
      ? initialSubjects
      : [{ subject: "", grade: "", predictedGrade: "" }]
  );

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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <fieldset className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Full name
          <input
            name="full_name"
            required
            defaultValue={initialFullName}
            className={inputClass}
            placeholder="e.g. Archie Richardson"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          School year
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
        <legend className="mb-1 text-sm font-medium">Subjects & grades</legend>
        {subjects.map((row, index) => (
          <div
            key={index}
            className="flex flex-wrap items-end gap-2"
          >
            <label className="flex flex-col gap-1 text-xs">
              Subject
              <input
                className={inputClass}
                value={row.subject}
                onChange={(e) => updateSubject(index, { subject: e.target.value })}
                placeholder="e.g. Computer Science"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Predicted grade
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
              Actual grade (if sat)
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
              className={`${buttonClass} disabled:opacity-40`}
              aria-label={`Remove subject ${row.subject || index + 1}`}
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addSubject} className={`${buttonClass} self-start`}>
          + Add subject
        </button>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Sector interest</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {SECTOR_OPTIONS.map((sector) => (
            <label key={sector} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="sectors"
                value={sector}
                defaultChecked={initialSectors.includes(sector)}
              />
              {sector}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Postcode
          <input
            name="postcode"
            required
            defaultValue={initialPostcode}
            className={inputClass}
            placeholder="e.g. SW1A 1AA"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Max commute
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
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Right to work in the UK</legend>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="right_to_work"
              value="yes"
              defaultChecked={initialRightToWork === true}
              required
            />
            Yes
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="right_to_work"
              value="no"
              defaultChecked={initialRightToWork === false}
            />
            No
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">
          Eligible for security clearance (SC/DV)?
        </legend>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="security_clearance_eligible"
              value="yes"
              defaultChecked={initialSecurityClearanceEligible === true}
            />
            Yes
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="security_clearance_eligible"
              value="no"
              defaultChecked={initialSecurityClearanceEligible === false}
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
            />
            Not sure
          </label>
        </div>
      </fieldset>

      <button
        formAction={saveOnboarding}
        className="self-start rounded bg-black px-4 py-2 text-sm text-white transition-transform active:scale-[0.97]"
      >
        Save & continue
      </button>
    </form>
  );
}
