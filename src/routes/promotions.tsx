import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { useRole, can } from "@/lib/roles";
import { listTeamPromotions } from "@/lib/workflow.functions";

export const Route = createFileRoute("/promotions")({
  head: () => ({ meta: [{ title: "Voyage Progression — The Odyssey Guide" }] }),
  component: () => <AuthGate><PromotionsPage /></AuthGate>,
});

function PromotionsPage() {
  const { role } = useRole();
  const allowed = can(role, "team.recommendPromotion") || can(role, "promotions.approve");
  const { data = [], isLoading } = useQuery({
    queryKey: ["team-promotions"],
    queryFn: () => listTeamPromotions(),
    enabled: allowed,
  });

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">Promotion Engine</div>
            <div className="text-xs text-muted-foreground">Live evaluation of every Hunter against configured rank criteria.</div>
          </div>
          <Link to="/" className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">← Ledger</Link>
        </header>

        {!allowed && <div className="rounded-md border border-border bg-ink/30 p-6 text-sm text-muted-foreground">Managers and Directors only.</div>}

        {allowed && isLoading && <div className="py-12 text-center text-xs text-muted-foreground">Evaluating…</div>}

        {allowed && !isLoading && (
          <section className="rounded-md border border-border bg-ink/30 p-3">
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-2 py-2">Hunter</th>
                  <th className="px-2 py-2">Current</th>
                  <th className="px-2 py-2">Next</th>
                  <th className="px-2 py-2 text-right">⭐</th>
                  <th className="px-2 py-2 text-right">A</th>
                  <th className="px-2 py-2 text-right">B</th>
                  <th className="px-2 py-2 text-right">Ach</th>
                  <th className="px-2 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map(({ staff, evaluation }: any) => {
                  const ev = evaluation;
                  return (
                    <tr key={staff.id} className="border-b border-border/40">
                      <td className="px-2 py-2">
                        <div>{staff.name}</div>
                        <div className="text-[10px] text-muted-foreground">{staff.role}</div>
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">{ev?.current_rank_name ?? "—"}</td>
                      <td className="px-2 py-2">{ev?.next_rank_name ?? "Max"}</td>
                      <td className="px-2 py-2 text-right">{ev?.total_stars ?? 0}{ev?.next_min_total_stars ? ` / ${ev.next_min_total_stars}` : ""}</td>
                      <td className="px-2 py-2 text-right">{ev?.a_grades ?? 0}{ev?.next_min_a_grades ? ` / ${ev.next_min_a_grades}` : ""}</td>
                      <td className="px-2 py-2 text-right">{ev?.b_grades ?? 0}{ev?.next_min_b_grades ? ` / ${ev.next_min_b_grades}` : ""}</td>
                      <td className="px-2 py-2 text-right">{ev?.unique_achievements ?? 0}{ev?.next_min_achievements ? ` / ${ev.next_min_achievements}` : ""}</td>
                      <td className="px-2 py-2 text-center">
                        {ev?.eligible ? (
                          <span className="rounded border border-emerald-400/50 bg-emerald-400/10 px-2 py-0.5 font-display text-[10px] uppercase tracking-widest text-emerald-300">Eligible</span>
                        ) : ev?.next_rank_key ? (
                          <span className="rounded border border-border px-2 py-0.5 font-display text-[10px] uppercase tracking-widest text-muted-foreground">Building</span>
                        ) : (
                          <span className="rounded border border-gold/40 px-2 py-0.5 font-display text-[10px] uppercase tracking-widest text-gold">Max</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!data.length && <tr><td colSpan={8} className="py-6 text-center text-xs text-muted-foreground">No Hunters in the fleet yet.</td></tr>}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}
