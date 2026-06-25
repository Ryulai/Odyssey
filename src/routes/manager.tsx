import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { useRole } from "@/lib/roles";
import { getManagerDashboard } from "@/lib/workflow.functions";

export const Route = createFileRoute("/manager")({
  head: () => ({ meta: [{ title: "Captain's Bridge — The Odyssey Guide" }] }),
  component: () => <AuthGate><ManagerPage /></AuthGate>,
});

function ManagerPage() {
  const { role } = useRole();
  const allowed = role === "manager" || role === "director";
  const { data, isLoading } = useQuery({
    queryKey: ["manager-dashboard"],
    queryFn: () => getManagerDashboard(),
    enabled: allowed,
  });

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">Captain's Bridge</div>
            <div className="text-xs text-muted-foreground">Your direct crew, grades, pending reviews, and promotion readiness.</div>
          </div>
          <Link to="/" className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">← Ledger</Link>
        </header>

        {!allowed && <div className="rounded-md border border-border bg-ink/30 p-6 text-sm text-muted-foreground">Captains and Shipbuilders only.</div>}
        {allowed && isLoading && <div className="py-12 text-center text-xs text-muted-foreground">Charting your crew…</div>}

        {allowed && data && <ManagerContent data={data} />}
      </div>
    </div>
  );
}

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function ManagerContent({ data }: { data: any }) {
  const { reports, pendingClaims, grades, locations, evaluations } = data;
  const latestGrade = (id: string) => grades.find((g: any) => g.staff_id === id);
  const locName = (id: string | null) => locations.find((l: any) => l.id === id)?.name ?? "—";
  const evalFor = (id: string) => evaluations.find((e: any) => e.staff_id === id)?.evaluation;
  const month = currentMonthKey();

  if (!reports.length) {
    return <div className="rounded-md border border-border bg-ink/30 p-6 text-sm text-muted-foreground">
      No direct reports assigned. A Shipbuilder must set you as the manager on a crew member from Admin → Staff.
    </div>;
  }

  const reviewedThisMonth = (id: string) => grades.some((g: any) => g.staff_id === id && String(g.month).startsWith(month));
  const pendingReviews = reports.filter((r: any) => !reviewedThisMonth(r.id));
  const readyForPromotion = reports.filter((r: any) => evalFor(r.id)?.eligible);
  const aGrades = grades.filter((g: any) => g.grade === "A").length;
  const bGrades = grades.filter((g: any) => g.grade === "B").length;

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 sm:grid-cols-4">
        <Stat label="Direct Reports" value={reports.length} />
        <Stat label="Pending Reviews" value={pendingReviews.length} accent={pendingReviews.length > 0 ? "amber" : undefined} />
        <Stat label="Pending Approvals" value={pendingClaims.length} accent={pendingClaims.length > 0 ? "amber" : undefined} />
        <Stat label="Promotion Ready" value={readyForPromotion.length} accent={readyForPromotion.length > 0 ? "emerald" : undefined} />
      </section>

      <section className="rounded-md border border-gold/30 bg-ink/30 p-4">
        <div className="mb-3 font-display text-xs uppercase tracking-widest text-gold">Direct Crew · {reports.length}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Fleet</th><th className="py-2 pr-3">Rank</th>
                <th className="py-2 pr-3">Latest Grade</th>
                <th className="py-2 pr-3">This Month</th>
                <th className="py-2 pr-3">Promotion</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r: any) => {
                const lg = latestGrade(r.id);
                const ev = evalFor(r.id);
                const reviewed = reviewedThisMonth(r.id);
                return (
                  <tr key={r.id} className="border-b border-border/40">
                    <td className="py-2 pr-3">{r.name}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{r.role}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{locName(r.location_id)}</td>
                    <td className="py-2 pr-3 text-muted-foreground capitalize">{r.current_rank_key ?? "—"}</td>
                    <td className="py-2 pr-3">{lg ? <span className="font-display text-gold">{lg.grade}</span> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="py-2 pr-3">
                      {reviewed
                        ? <span className="text-emerald-400 text-xs">Reviewed</span>
                        : <Link to="/evaluations" className="text-amber-300 text-xs underline">Pending →</Link>}
                    </td>
                    <td className="py-2 pr-3">
                      {ev?.eligible
                        ? <span className="text-emerald-400">Ready → {ev.next_rank_name ?? "next"}</span>
                        : ev?.next_rank_key
                          ? <span className="text-muted-foreground">{ev.total_stars}/{ev.next_min_total_stars}★</span>
                          : <span className="text-muted-foreground">Top rank</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-gold/30 bg-ink/30 p-4">
          <div className="mb-3 font-display text-xs uppercase tracking-widest text-gold">Monthly Performance</div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <Stat label="A-Grades" value={aGrades} />
            <Stat label="B-Grades" value={bGrades} />
          </div>
          {!grades.length && <div className="mt-3 text-center text-xs text-muted-foreground">No evaluations recorded yet.</div>}
        </div>

        <div className="rounded-md border border-gold/30 bg-ink/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-display text-xs uppercase tracking-widest text-gold">Pending Harbor Records · {pendingClaims.length}</div>
            <Link to="/claims" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-gold">Review →</Link>
          </div>
          {!pendingClaims.length ? (
            <div className="py-4 text-center text-xs text-muted-foreground">No pending submissions.</div>
          ) : (
            <ul className="divide-y divide-border/40 text-sm">
              {pendingClaims.map((c: any) => {
                const who = reports.find((r: any) => r.id === c.staff_id);
                return (
                  <li key={c.id} className="flex items-center justify-between py-2">
                    <div>
                      <div>{who?.name ?? "Unknown"} <span className="text-muted-foreground">· {c.achievement?.name ?? "Achievement"}</span></div>
                      <div className="text-[11px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-xs text-gold">+{c.achievement?.star_reward ?? 0}★</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: "amber" | "emerald" }) {
  const color = accent === "amber" ? "text-amber-300" : accent === "emerald" ? "text-emerald-400" : "text-gold";
  return (
    <div className="rounded-md border border-border bg-ink/20 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-display text-3xl ${color}`}>{value}</div>
    </div>
  );
}
