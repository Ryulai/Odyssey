import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { getSupervisorGradeBoard, type BoardGroup, type GroupKey } from "@/lib/grade-board.functions";

export const Route = createFileRoute("/team-grades")({
  head: () => ({
    meta: [
      { title: "Team Grades — The Odyssey Guide" },
      { name: "description", content: "Manager and Director view of monthly Performance Review Grades, ranked separately by Department and Manager group." },
      { property: "og:title", content: "Team Grades — The Odyssey Guide" },
      { property: "og:description", content: "Monthly A/B/C/D Grades by Department and Manager group." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthGate><TeamGradesPage /></AuthGate>,
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TABS: Array<{ key: "all" | GroupKey; label: string }> = [
  { key: "all", label: "All" }, { key: "warrior", label: "Warrior" }, { key: "mage", label: "Mage" },
  { key: "priest", label: "Priest" }, { key: "ranger", label: "Ranger" }, { key: "manager", label: "Manager" },
];

function TeamGradesPage() {
  const [tab, setTab] = useState<"all" | GroupKey>("all");
  const [year, setYear] = useState(new Date().getUTCFullYear());
  const [month, setMonth] = useState<number | null>(null);
  const q = useQuery({
    queryKey: ["grade-board", year, month],
    queryFn: () => getSupervisorGradeBoard({ data: { year, month } }),
  });

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">Team Grades</div>
            <div className="text-xs text-muted-foreground">Monthly Performance Review Grades · each group ranked on its own.</div>
          </div>
          <Link to="/" className="rounded-md border border-border px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">← Home</Link>
        </header>

        {q.isLoading ? (
          <Box>Loading…</Box>
        ) : q.error ? (
          <Box>Could not load grades. Please try again.</Box>
        ) : !q.data?.authorized ? (
          <Box>This view is available to Managers and Directors only. You can still see your own <Link to="/performance" className="text-gold">Performance Review</Link>.</Box>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-border p-1">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`rounded-md px-4 py-2 text-[11px] uppercase tracking-widest ${tab === t.key ? "bg-gold/10 text-gold" : "text-muted-foreground hover:text-foreground"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Year</label>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-md border border-border bg-ink/40 px-3 py-2 text-sm">
                {q.data.years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Month</label>
              <select value={month ?? 0} onChange={(e) => setMonth(Number(e.target.value) || null)} className="rounded-md border border-border bg-ink/40 px-3 py-2 text-sm">
                <option value={0}>All Months</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <p className="mb-5 rounded-md border border-gold/25 bg-gold/5 p-3 text-xs text-muted-foreground">
              A · B · C · D is the overall Performance Review Grade, not the four Behaviour sections. Every group is ranked separately — Managers never appear in Department rankings.
            </p>
            <div className="space-y-6">
              {q.data.groups.filter((g) => tab === "all" || g.key === tab).map((g) => (
                <GroupTable key={g.key} group={g} year={year} month={month} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function GroupTable({ group, year, month }: { group: BoardGroup; year: number; month: number | null }) {
  const cols = month ? [month] : MONTHS.map((_, i) => i + 1);
  return (
    <section className="rounded-xl border border-border bg-ink/20 p-4">
      <div className="mb-3 font-display text-sm uppercase tracking-[0.3em] text-gold">{group.label} · Ranking</div>
      {group.members.length === 0 ? (
        <div className="text-xs text-muted-foreground">No one in this group yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="py-2 pr-2 text-left">#</th>
                <th className="py-2 pr-2 text-left">Name</th>
                <th className="py-2 pr-2 text-left">{group.key === "manager" ? "Department" : "Class"}</th>
                {cols.map((m) => <th key={m} className="px-1 py-2 text-center">{MONTHS[m - 1]}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {group.members.map((p) => (
                <tr key={p.staff_id}>
                  <td className="py-2 pr-2 text-muted-foreground">{p.rank ?? "—"}</td>
                  <td className="py-2 pr-2">{p.name}</td>
                  <td className="py-2 pr-2 text-xs text-muted-foreground">
                    {group.key === "manager" ? (p.department ?? "—") : (p.class_label ?? "—")}
                  </td>
                  {cols.map((m) => {
                    const g = p.grades[`${year}-${String(m).padStart(2, "0")}`];
                    return <td key={m} className={`px-1 py-2 text-center font-display ${g ? "text-gold" : "text-muted-foreground/40"}`}>{g ?? "—"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-ink/20 p-10 text-center text-sm text-muted-foreground">{children}</div>;
}
