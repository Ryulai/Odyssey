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
            <div className="text-xs text-muted-foreground">Every fleet, every captain, every navigator — live from the ledger.</div>
          </div>
          <Link to="/" className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">← Dashboard</Link>
        </header>

        {!allowed && <div className="rounded-md border border-border bg-ink/30 p-6 text-sm text-muted-foreground">Shipbuilders (Directors) only.</div>}
        {allowed && isLoading && <div className="py-12 text-center text-xs text-muted-foreground">Surveying the fleet…</div>}

        {allowed && data && <FleetContent data={data} />}
      </div>
    </div>
  );
}

function FleetContent({ data }: { data: any }) {
  const { locations, staff, grades, claims, evaluations, ranks } = data;
  const activeStaff = staff.filter((s: any) => s.status !== "inactive");
  const evalMap = new Map<string, any>(evaluations.map((e: any) => [e.staff_id, e.evaluation]));
  const promotedStaff = activeStaff.filter((s: any) => {
    const r = ranks.find((rk: any) => rk.key === s.current_rank_key);
    return r && r.position > 1;
  });

  const fleetStats = (locId: string) => {
    const crew = activeStaff.filter((s: any) => s.location_id === locId);
    const ids = new Set(crew.map((c: any) => c.id));
    const recent = grades.filter((g: any) => ids.has(g.staff_id));
    const aCount = recent.filter((g: any) => g.grade === "A").length;
    const pending = claims.filter((c: any) => ids.has(c.staff_id) && c.status === "pending").length;
    const candidates = crew.filter((c: any) => evalMap.get(c.id)?.eligible).length;
    return { crew, aCount, pending, candidates };
  };

  const unassigned = activeStaff.filter((s: any) => !s.location_id && s.role !== "Director");

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Fleet Built" value={locations.length} hint="locations launched" />
        <StatCard label="Total Team" value={activeStaff.length} hint="active members" />
        <StatCard label="Voyagers Guided" value={promotedStaff.length} hint="staff promoted past entry" />
        <StatCard label="Pending Claims" value={claims.filter((c: any) => c.status === "pending").length} hint="awaiting review" />
      </section>

      <section className="rounded-md border border-gold/30 bg-ink/30 p-4">
        <div className="mb-3 font-display text-xs uppercase tracking-widest text-gold">Fleet Roster</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3">Location</th>
                <th className="py-2 pr-3">Manager</th>
                <th className="py-2 pr-3">Staff</th>
                <th className="py-2 pr-3">Promotion Candidates</th>
                <th className="py-2 pr-3">Pending Claims</th>
                <th className="py-2 pr-3">A-grades</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc: any) => {
                const crewHere = activeStaff.filter((x: any) => x.location_id === loc.id);
                // Option A — auto-derive: explicit loc.manager_id wins, else the staff at this fleet
                // who other crew at this fleet report to (de-facto captain), else any Manager-role here.
                const explicit = staff.find((s: any) => s.id === loc.manager_id);
                const reportedTo = crewHere.find((c: any) => crewHere.some((o: any) => o.manager_id === c.id));
                const managerRole = crewHere.find((c: any) => (c.app_role ?? c.system_role) === "manager");
                const captain = explicit ?? reportedTo ?? managerRole;
                const derived = !explicit && !!captain;
                const s = fleetStats(loc.id);
                return (
                  <tr key={loc.id} className="border-b border-border/40">
                    <td className="py-2 pr-3">
                      <div className="font-display text-gold">{loc.name}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{loc.kind ?? "venue"}{loc.code ? ` · ${loc.code}` : ""}</div>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {captain ? (
                        <>
                          <span>{captain.name}</span>
                          {derived && <span className="ml-2 rounded border border-border/60 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">auto</span>}
                        </>
                      ) : <span className="text-amber-300">— Unassigned —</span>}
                    </td>
                    <td className="py-2 pr-3">{s.crew.length}</td>
                    <td className="py-2 pr-3">{s.candidates > 0 ? <span className="text-emerald-400">{s.candidates}</span> : <span className="text-muted-foreground">0</span>}</td>
                    <td className="py-2 pr-3">{s.pending > 0 ? <span className="text-amber-300">{s.pending}</span> : <span className="text-muted-foreground">0</span>}</td>
                    <td className="py-2 pr-3 text-gold">{s.aCount}</td>
                  </tr>
                );
              })}
              {!locations.length && (
                <tr><td colSpan={6} className="py-6 text-center text-xs text-muted-foreground">No fleets configured. Create one from Admin → Fleets.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {locations.map((loc: any) => {
        const s = fleetStats(loc.id);
        if (!s.crew.length) return null;
        return (
          <section key={loc.id} className="rounded-md border border-border bg-ink/20 p-4">
            <div className="mb-2 font-display text-sm text-gold">{loc.name} · Crew</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3">Navigator</th><th className="py-2 pr-3">Role</th>
                    <th className="py-2 pr-3">Rank</th><th className="py-2 pr-3">Last Grade</th>
                    <th className="py-2 pr-3">Promotion</th>
                  </tr>
                </thead>
                <tbody>
                  {s.crew.map((c: any) => {
                    const lg = grades.find((g: any) => g.staff_id === c.id);
                    const ev = evalMap.get(c.id);
                    return (
                      <tr key={c.id} className="border-b border-border/40">
                        <td className="py-2 pr-3">{c.name}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{c.role}</td>
                        <td className="py-2 pr-3 text-muted-foreground capitalize">{c.current_rank_key ?? "—"}</td>
                        <td className="py-2 pr-3">{lg ? <span className="font-display text-gold">{lg.grade}</span> : <span className="text-muted-foreground">—</span>}</td>
                        <td className="py-2 pr-3">{ev?.eligible
                          ? <span className="text-emerald-400">Ready → {ev.next_rank_name}</span>
                          : ev?.next_rank_key ? <span className="text-muted-foreground">Building</span>
                          : <span className="text-muted-foreground">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {unassigned.length > 0 && (
        <section className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="font-display text-xs uppercase tracking-widest text-amber-300">Unassigned Crew · {unassigned.length}</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Assign these to a fleet from Admin → Staff: {unassigned.map((u: any) => u.name).join(", ")}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-md border border-gold/30 bg-ink/30 p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-3xl text-gold">{value}</div>
      {hint && <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{hint}</div>}
    </div>
  );
}
