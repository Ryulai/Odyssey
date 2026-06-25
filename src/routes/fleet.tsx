import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { useRole } from "@/lib/roles";
import { getFleetOverview } from "@/lib/workflow.functions";

export const Route = createFileRoute("/fleet")({
  head: () => ({ meta: [{ title: "Shipbuilder Fleet — The Odyssey Guide" }] }),
  component: () => <AuthGate><FleetPage /></AuthGate>,
});

function FleetPage() {
  const { role } = useRole();
  const allowed = role === "director";
  const { data, isLoading } = useQuery({
    queryKey: ["fleet-overview"],
    queryFn: () => getFleetOverview(),
    enabled: allowed,
  });

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">Shipbuilder · Fleet Overview</div>
            <div className="text-xs text-muted-foreground">Every fleet, every captain, every navigator — at a glance.</div>
          </div>
          <Link to="/" className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">← Ledger</Link>
        </header>

        {!allowed && <div className="rounded-md border border-border bg-ink/30 p-6 text-sm text-muted-foreground">Shipbuilders (Directors) only.</div>}
        {allowed && isLoading && <div className="py-12 text-center text-xs text-muted-foreground">Surveying the fleet…</div>}

        {allowed && data && <FleetContent data={data} />}
      </div>
    </div>
  );
}

function FleetContent({ data }: { data: any }) {
  const { locations, staff, grades, claims } = data;
  const unassigned = staff.filter((s: any) => !s.location_id && s.role_family !== "operational");

  const fleetStats = (locId: string) => {
    const crew = staff.filter((s: any) => s.location_id === locId);
    const ids = new Set(crew.map((c: any) => c.id));
    const recentGrades = grades.filter((g: any) => ids.has(g.staff_id));
    const aCount = recentGrades.filter((g: any) => g.grade === "A").length;
    const pending = claims.filter((c: any) => ids.has(c.staff_id) && c.status === "pending").length;
    return { crew, aCount, pending, total: recentGrades.length };
  };

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Fleets" value={locations.length} />
        <StatCard label="Total Crew" value={staff.filter((s: any) => s.status !== "inactive").length} />
        <StatCard label="Pending Claims" value={claims.filter((c: any) => c.status === "pending").length} />
      </section>

      <section className="grid gap-4">
        {locations.map((loc: any) => {
          const captain = staff.find((s: any) => s.id === loc.manager_id);
          const stats = fleetStats(loc.id);
          return (
            <div key={loc.id} className="rounded-md border border-gold/30 bg-ink/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-display text-lg text-gold">{loc.name}</div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    {loc.kind ?? "venue"}{loc.code ? ` · ${loc.code}` : ""} · Captain: {captain?.name ?? "— Unassigned —"}
                  </div>
                </div>
                <div className="flex gap-4 text-xs">
                  <Badge label="Crew" value={stats.crew.length} />
                  <Badge label="A-grades" value={stats.aCount} accent />
                  <Badge label="Pending" value={stats.pending} />
                </div>
              </div>
              {stats.crew.length ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="py-2 pr-3">Navigator</th><th className="py-2 pr-3">Role</th>
                        <th className="py-2 pr-3">Rank</th><th className="py-2 pr-3">Last Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.crew.map((c: any) => {
                        const lg = grades.find((g: any) => g.staff_id === c.id);
                        return (
                          <tr key={c.id} className="border-b border-border/40">
                            <td className="py-2 pr-3">{c.name}</td>
                            <td className="py-2 pr-3 text-muted-foreground">{c.role}</td>
                            <td className="py-2 pr-3 text-muted-foreground capitalize">{c.current_rank_key ?? "—"}</td>
                            <td className="py-2 pr-3">{lg ? <span className="font-display text-gold">{lg.grade}</span> : <span className="text-muted-foreground">—</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-3 text-xs text-muted-foreground">No crew assigned to this fleet.</div>
              )}
            </div>
          );
        })}
        {!locations.length && <div className="rounded-md border border-border bg-ink/30 p-6 text-center text-xs text-muted-foreground">No fleets configured. Create one from Admin → Fleets.</div>}
      </section>

      {unassigned.length > 0 && (
        <section className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="font-display text-xs uppercase tracking-widest text-amber-300">Unassigned Crew · {unassigned.length}</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {unassigned.map((u: any) => u.name).join(", ")}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-gold/30 bg-ink/30 p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-3xl text-gold">{value}</div>
    </div>
  );
}
function Badge({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={"rounded border px-2 py-1 " + (accent ? "border-gold/40 text-gold" : "border-border text-muted-foreground")}>
      <span className="font-display">{value}</span> <span className="text-[10px] uppercase tracking-widest">{label}</span>
    </div>
  );
}
