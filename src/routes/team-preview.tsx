import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { getMyTeamScope, getReportPreview, type ReportPreview } from "@/lib/team-preview.functions";

export const Route = createFileRoute("/team-preview")({
  head: () => ({
    meta: [
      { title: "Team Review Preview — The Odyssey Guide" },
      { name: "description", content: "Preview the Performance Review and Achievement information of the team members who report directly to you, in preparation for evaluation." },
      { property: "og:title", content: "Team Review Preview — The Odyssey Guide" },
      { property: "og:description", content: "Read-only preparation view of your direct reports' performance and achievements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthGate><TeamPreviewPage /></AuthGate>,
});

function TeamPreviewPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"performance" | "achievements">("performance");

  const scope = useQuery({ queryKey: ["team-scope"], queryFn: () => getMyTeamScope() });

  if (scope.isLoading) return <Shell><Box>Loading your team…</Box></Shell>;

  if (!scope.data?.has_direct_reports) {
    return (
      <Shell>
        <Box>
          No team members report directly to you, so there is nothing to preview here.
          You can always view your own <Link to="/performance" className="text-gold">Performance Review</Link> and{" "}
          <Link to="/achievements" className="text-gold">Achievements</Link>.
        </Box>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-6 rounded-lg border border-gold/25 bg-gold/5 p-4 text-xs text-muted-foreground">
        <span className="font-display uppercase tracking-widest text-gold">Preview only</span> — this is review
        preparation. Nothing here is submitted, finalised or approved. Use the normal review flow to record an evaluation.
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="rounded-xl border border-border bg-ink/20 p-4">
          <div className="mb-3 font-display text-xs uppercase tracking-[0.3em] text-gold">
            Direct Reports · {scope.data.reports.length}
          </div>
          <ul className="space-y-1">
            {scope.data.reports.map((r) => (
              <li key={r.staff_id}>
                <button
                  onClick={() => setSelected(r.staff_id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                    selected === r.staff_id
                      ? "border-gold/50 bg-gold/10 text-gold"
                      : "border-transparent text-foreground hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{r.name}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {r.latest_grade ?? "—"}
                    </span>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {r.current_rank_key ?? "unranked"} · ★ {r.total_stars}
                    {r.pending_claims > 0 ? ` · ${r.pending_claims} pending` : ""}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section>
          {!selected ? (
            <Box>Select a team member to preview their Performance Review and Achievement information.</Box>
          ) : (
            <>
              <div className="mb-4 flex rounded-md border border-border overflow-hidden w-fit">
                <TabButton active={tab === "performance"} onClick={() => setTab("performance")}>Preview Performance Review</TabButton>
                <TabButton active={tab === "achievements"} onClick={() => setTab("achievements")}>Preview Achievement</TabButton>
              </div>
              <ReportPanel staffId={selected} tab={tab} />
            </>
          )}
        </section>
      </div>
    </Shell>
  );
}

function ReportPanel({ staffId, tab }: { staffId: string; tab: "performance" | "achievements" }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["report-preview", staffId],
    queryFn: () => getReportPreview({ data: { staff_id: staffId } }),
  });

  if (isLoading) return <Box>Loading preview…</Box>;
  if (error) return <Box>{(error as Error).message}</Box>;
  if (!data) return <Box>No data.</Box>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-ink/20 p-5">
        <div className="font-display text-lg text-gold">{data.staff.name}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {data.staff.role || "—"} · Rank {data.staff.current_rank_key ?? "—"} · ★ {data.total_stars}
        </div>
      </div>

      {tab === "performance" ? (
        <PerformanceGradeHistory performance={data.performance} staffName={data.staff.name} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.achievements.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-ink/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{a.icon} {a.name}</span>
                <span className="font-display text-sm text-gold">★ {a.stars}</span>
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                {a.count} earned{a.pending > 0 ? ` · ${a.pending} pending review` : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function PerformanceGradeHistory({
  performance,
  staffName,
}: {
  performance: ReportPreview["performance"];
  staffName: string;
}) {
  // month -> Grade lookup, keyed by YYYY-MM (day-agnostic)
  const byKey = new Map<string, string>();
  for (const p of performance) byKey.set(p.month.slice(0, 7), p.grade);
  const years = Array.from(new Set(performance.map((p) => p.month.slice(0, 4)))).sort((a, b) => b.localeCompare(a));

  const [year, setYear] = useState<string>(years[0] ?? "");
  const [monthIdx, setMonthIdx] = useState<number>(-1); // -1 = All Months

  const gradeFor = (y: string, idx: number) => {
    const mm = String(idx + 1).padStart(2, "0");
    return byKey.get(`${y}-${mm}`) ?? null;
  };

  if (performance.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-ink/20 p-5">
        <div className="font-display text-sm uppercase tracking-widest text-foreground">
          Performance Review · No submitted review yet
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          You have preview access to {staffName}'s Performance Review, but no monthly review has been
          submitted for this team member yet. Once a monthly review is submitted, the Grade (A · B · C · D) for
          that month appears here automatically.
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          Read-only preparation view · nothing is calculated or approved here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-gold/25 bg-gold/5 p-3 text-xs text-muted-foreground">
        <span className="font-display uppercase tracking-widest text-gold">Grade</span> = the overall
        Performance Review Grade (A · B · C · D), not the four Behaviour sections.
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Year</label>
        <select
          value={year}
          onChange={(e) => { setYear(e.target.value); setMonthIdx(-1); }}
          className="rounded-md border border-border bg-ink/40 px-3 py-2 text-sm text-foreground"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Month</label>
        <select
          value={monthIdx}
          onChange={(e) => setMonthIdx(Number(e.target.value))}
          className="rounded-md border border-border bg-ink/40 px-3 py-2 text-sm text-foreground"
        >
          <option value={-1}>All Months</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i}>{m}</option>
          ))}
        </select>
      </div>

      {monthIdx === -1 ? (
        <div className="rounded-xl border border-border bg-ink/20 p-5">
          <div className="mb-3 font-display text-sm uppercase tracking-widest text-foreground">
            {year} · Grade History
          </div>
          <ul className="divide-y divide-border/60">
            {MONTHS_SHORT.map((short, i) => {
              const g = gradeFor(year, i);
              return (
                <li key={short} className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{MONTHS[i]}</span>
                  <span className={`font-display text-lg ${g ? "text-gold" : "text-muted-foreground/50"}`}>
                    {g ?? "—"}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            Months with no submitted review show “—”. Read-only preparation view.
          </p>
        </div>
      ) : (
        (() => {
          const g = gradeFor(year, monthIdx);
          return (
            <div className="rounded-xl border border-border bg-ink/20 p-6 text-center">
              <div className="font-display text-sm uppercase tracking-widest text-muted-foreground">
                {MONTHS[monthIdx]} {year}
              </div>
              <div className={`mt-2 font-display text-5xl ${g ? "text-gold" : "text-muted-foreground/40"}`}>
                {g ?? "—"}
              </div>
              <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                {g ? "Performance Review Grade" : "No submitted review for this month"}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">Team Review Preview</div>
            <div className="text-xs text-muted-foreground">Preparation view for the people who report directly to you.</div>
          </div>
          <Link to="/" className="rounded-md border border-border px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">← Home</Link>
        </header>
        {children}
      </div>
    </div>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-ink/20 p-10 text-center text-sm text-muted-foreground">{children}</div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-[10px] uppercase tracking-widest ${active ? "bg-gold/10 text-gold" : "text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}
