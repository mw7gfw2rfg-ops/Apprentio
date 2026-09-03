import { Bell, BellOff } from "lucide-react";
import type { EmployerToWatch } from "@/lib/vacancies/employer-interest";
import { registerEmployerInterest, unregisterEmployerInterest } from "./actions";

export function EmployersToWatch({
  employers,
  registeredIds,
}: {
  employers: EmployerToWatch[];
  registeredIds: string[];
}) {
  if (employers.length === 0) return null;

  const registered = new Set(registeredIds);

  return (
    <div className="rounded-[20px_18px_21px_19px] border border-[var(--warm-sky-border)] bg-[var(--warm-sky)] p-5">
      <div className="font-heading text-base font-bold text-[var(--warm-sky-foreground)]">
        Employers to watch
      </div>
      <p className="mt-1 text-sm text-[var(--warm-sky-foreground)]/90">
        These target employers don&apos;t have a live vacancy right now, but our research
        says they run this apprenticeship — register interest and we&apos;ll flag it here
        once one goes live.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {employers.map((employer) => {
          const isRegistered = registered.has(employer.id);
          return (
            <div
              key={employer.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--warm-sky-border)] bg-card px-4 py-3"
            >
              <div>
                <span className="font-bold text-foreground">{employer.employer_name}</span>
                {employer.opensHint && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    Opens {employer.opensHint}
                  </span>
                )}
              </div>
              <form
                action={isRegistered ? unregisterEmployerInterest : registerEmployerInterest}
              >
                <input type="hidden" name="employer_source_id" value={employer.id} />
                <button
                  type="submit"
                  className={
                    isRegistered
                      ? "inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      : "inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
                  }
                >
                  {isRegistered ? (
                    <>
                      <BellOff className="size-3.5" />
                      Registered
                    </>
                  ) : (
                    <>
                      <Bell className="size-3.5" />
                      Register interest
                    </>
                  )}
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
