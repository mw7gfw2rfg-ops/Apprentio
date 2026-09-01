import type { ApplicationAnalytics } from "@/lib/dashboard/analytics";

function BarTrack({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

const LEVEL_LABEL: Record<number, string> = {
  2: "Level 2",
  3: "Level 3",
  4: "Level 4",
  5: "Level 5",
  6: "Level 6",
  7: "Level 7",
};

export function AnalyticsSection({ analytics, total }: { analytics: ApplicationAnalytics; total: number }) {
  if (!analytics.hasData) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="mb-3 font-heading text-lg font-bold">Your application analytics</div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[22px_18px_24px_20px] border border-border bg-card p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_20px_34px_-26px_rgba(96,74,52,0.5)]">
          <div className="text-sm font-extrabold text-muted-foreground">Average match score</div>
          {analytics.avgMatch === null ? (
            <p className="mt-2.5 text-sm text-muted-foreground">
              Upload your base CV to see this — no matches computed yet.
            </p>
          ) : (
            <>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="font-heading text-3xl font-bold">{analytics.avgMatch}%</span>
                <span className="text-xs text-muted-foreground/80">
                  across {analytics.matchedCount} application{analytics.matchedCount === 1 ? "" : "s"}
                </span>
              </div>
              <BarTrack pct={analytics.avgMatch} color="#6FA383" />
            </>
          )}
        </div>

        <div className="rounded-[22px_18px_24px_20px] border border-border bg-card p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_20px_34px_-26px_rgba(96,74,52,0.5)]">
          <div className="mb-3 text-sm font-extrabold text-muted-foreground">Sector mix</div>
          {analytics.sectorRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vacancy-backed applications yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {analytics.sectorRows.slice(0, 4).map((row, i) => (
                <div key={row.sector}>
                  <div className="flex justify-between text-[13px] font-bold text-muted-foreground">
                    <span>{row.sector}</span>
                    <span className="text-muted-foreground/70">{row.count}</span>
                  </div>
                  <BarTrack pct={row.pct} color={PALETTE[i % PALETTE.length]} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[22px_18px_24px_20px] border border-border bg-card p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_20px_34px_-26px_rgba(96,74,52,0.5)]">
          <div className="mb-3 text-sm font-extrabold text-muted-foreground">By apprenticeship level</div>
          {analytics.levelRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vacancy-backed applications yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {analytics.levelRows.map((row, i) => (
                <div key={row.level}>
                  <div className="flex justify-between text-[13px] font-bold text-muted-foreground">
                    <span>{LEVEL_LABEL[row.level] ?? `Level ${row.level}`}</span>
                    <span className="text-muted-foreground/70">{row.count}</span>
                  </div>
                  <BarTrack pct={row.pct} color={PALETTE[(i + 2) % PALETTE.length]} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[22px_18px_24px_20px] border border-border bg-card p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_20px_34px_-26px_rgba(96,74,52,0.5)]">
          <div className="text-sm font-extrabold text-muted-foreground">Average commute</div>
          {analytics.avgDistance === null ? (
            <p className="mt-2.5 text-sm text-muted-foreground">
              Add your postcode to your profile to see this.
            </p>
          ) : (
            <>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="font-heading text-3xl font-bold">{analytics.avgDistance}</span>
                <span className="text-xs text-muted-foreground/80">miles average</span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground/70">
                Range: {analytics.minDistance}–{analytics.maxDistance} mi from home
              </p>
            </>
          )}
        </div>

        {analytics.upcomingDeadlines.length > 0 && (
          <div className="rounded-[22px_18px_24px_20px] border border-[var(--warm-peach-border)] bg-[var(--warm-peach)] p-5 sm:col-span-2">
            <div className="mb-3 text-sm font-extrabold text-[var(--warm-peach-foreground)]">
              Closing soon
            </div>
            <div className="flex flex-col gap-2.5">
              {analytics.upcomingDeadlines.map((d) => (
                <div
                  key={`${d.role}-${d.employer}`}
                  className="flex items-center justify-between gap-2.5 rounded-2xl border border-[var(--warm-peach-border)] bg-card px-3.5 py-2.5"
                >
                  <span>
                    <span className="block text-sm font-extrabold">{d.role}</span>
                    <span className="block text-xs text-muted-foreground">{d.employer}</span>
                  </span>
                  <span className="shrink-0 rounded-full border border-[var(--warm-peach-border)] bg-[var(--warm-peach)] px-2.5 py-1 text-xs font-extrabold text-[var(--warm-peach-foreground)]">
                    {d.closesInDays}d left
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-[22px_18px_24px_20px] border border-border bg-card p-5">
        <div className="mb-1 text-sm font-extrabold text-muted-foreground">
          Activity over the last 12 weeks
        </div>
        <p className="mb-4 text-xs text-muted-foreground/70">
          {total > 0
            ? "Each day: top half is applications sent, bottom half is company replies."
            : "Nothing tracked yet — this fills in as you submit applications."}
        </p>
        <div
          className="grid w-full gap-1"
          style={{ gridTemplateRows: "repeat(7, 22px)", gridAutoFlow: "column" }}
        >
          {analytics.activityHeatmap.map((cell) => {
            const sentBg = cell.future ? "transparent" : shade(cell.sentCount, "#9CC1E0", "#3B6285");
            const repliedBg = cell.future ? "transparent" : shade(cell.repliedCount, "#8FBFA0", "#35604D");
            return (
              <span
                key={cell.date}
                title={cell.future ? "" : `${cell.date} — ${cell.sentCount} sent, ${cell.repliedCount} replied`}
                className="rounded-[3px]"
                style={{
                  background: `linear-gradient(to bottom, ${sentBg} 50%, ${repliedBg} 50%)`,
                  border: cell.future ? undefined : "1px solid rgba(0,0,0,.04)",
                }}
              />
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 border-t border-dashed border-border pt-3.5 text-xs text-muted-foreground">
          <LegendDot color="#3B6285" label="Applications sent" />
          <LegendDot color="#35604D" label="Company replies" />
          <LegendDot color="#9CC1E0" label="1 per day" />
          <LegendDot color="#8FBFA0" label="2+ per day" />
          <LegendDot color="#F1EADC" label="No activity" bordered />
        </div>
      </div>
    </div>
  );
}

const PALETTE = ["#6FA3C7", "#D98E63", "#6FA383", "#B79ACB", "#E0B24C", "#C97B84"];

function shade(count: number, one: string, twoPlus: string): string {
  if (count === 0) return "#F1EADC";
  if (count === 1) return one;
  return twoPlus;
}

function LegendDot({ color, label, bordered }: { color: string; label: string; bordered?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block size-3 rounded-[3px]"
        style={{ background: color, border: bordered ? "1.5px solid var(--warm-tan-border)" : undefined }}
      />
      {label}
    </span>
  );
}
