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
            <div className="text-xs text-muted-foreground">Your direct crew, pending claims, grades and promotion readiness.</div>
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

function ManagerContent({ data }: { data: any }) {
  const { reports, pendingClaims, grades, locations, evaluations } = data;
  const latestGrade = (id: string) => grades.find((g: any) => g.staff_id === id);
  const locName = (id: string | null) => locations.find((l: any) => l.id === id)?.name ?? "—";
  const evalFor = (id: string) => evaluations.find((e: any) => e.staff_id === id)?.evaluation;

  if (!reports.length) {
    return <div className="rounded-md border border-border bg-ink/30 p-6 text-sm text-muted-foreground">No direct reports assigned to you yet.</div>;
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-md border border-gold/30 bg-ink/30 p-4">
        <div className="mb-3 font-display text-xs uppercase tracking-widest text-gold">Direct Crew · {reports.length}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Fleet</th><th className="py-2 pr-3">Rank</th>
                <th className="py-2 pr-3">Latest Grade</th><th className="py-2 pr-3">Promotion</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r: any) => {
                const lg = latestGrade(r.id);
                const ev = evalFor(r.id);
                return (
                  <tr key={r.id} className="border-b border-border/40">
                    <td className="py-2 pr-3">{r.name}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{r.role}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{locName(r.location_id)}</td>
                    <td className="py-2 pr-3 text-muted-foreground capitalize">{r.current_rank_key ?? "—"}</td>
                    <td className="py-2 pr-3">{lg ? <span className="font-display text-gold">{lg.grade}</span> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="py-2 pr-3">
                      {ev?.ready ? <span className="text-emerald-400">Ready → {ev.next_rank_key ?? "next"}</span> :
                        ev?.next_rank_key ? <span className="text-muted-foreground">Building ({Math.round((ev.progress ?? 0) * 100)}%)</span> :
                        <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-md border border-gold/30 bg-ink/30 p-4">
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
      </section>
    </div>
  );
}
