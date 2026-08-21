import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { getMyTeamScope, getReportPreview } from "@/lib/team-preview.functions";

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
        data.performance.length === 0 ? (
          <div className="rounded-xl border border-border bg-ink/20 p-5">
            <div className="font-display text-sm uppercase tracking-widest text-foreground">
              Performance Review · No submitted review yet
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              You have preview access to {data.staff.name}'s Performance Review, but no monthly review has been
              submitted for this team member yet. Once a monthly review is submitted, the grade, Class and Guild
              points, and the four behaviour dimensions appear here automatically.
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              Read-only preparation view · nothing is calculated or approved here
            </p>
          </div>
        ) : (

          <div className="space-y-4">
            {data.performance.map((m) => (
              <div key={m.month} className="rounded-xl border border-border bg-ink/20 p-5">
                <div className="flex items-baseline justify-between">
                  <div className="font-display text-sm uppercase tracking-widest text-foreground">{m.label}</div>
                  <div className="font-display text-2xl text-gold">{m.grade}</div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Total {m.total}/100 · Class {m.class_points}/50 · Guild {m.guild_points}/50
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {m.behaviours.map((b) => (
                    <div key={b.key} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-xs">
                      <span className="text-muted-foreground">{b.name}</span>
                      <span className="text-foreground">{Math.round(b.percent)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
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
