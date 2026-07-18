import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { useRole, can } from "@/lib/roles";
import { GRADE_META } from "@/lib/employee-data";
import { listStaff, getGradeConfig } from "@/lib/config.functions";
import { listEvaluations, submitEvaluation, deleteEvaluation, computeComposite } from "@/lib/evaluations.functions";

export const Route = createFileRoute("/evaluations")({
  head: () => ({ meta: [{ title: "1111 — The Odyssey Guide" }] }),
  component: () => <AuthGate><EvaluationsPage /></AuthGate>,
});

const inputCls = "w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none";

function firstOfMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

const FACTORS: { key: "sales" | "attendance" | "achievements" | "review" | "discipline" | "kpi"; label: string; hint: string }[] = [
  { key: "sales",        label: "Trade Performance", hint: "Sales / revenue contribution" },
  { key: "attendance",   label: "Attendance",        hint: "Punctuality & presence" },
  { key: "achievements", label: "Achievements",      hint: "Approved Achievements this period" },
  { key: "review",       label: "Reputation",   hint: "Peer + customer review score" },
  { key: "discipline",   label: "Discipline",        hint: "Conduct, SOP adherence" },
  { key: "kpi",          label: "KPI Completion",    hint: "Targets hit vs assigned" },
];

function EvaluationsPage() {
  const { role } = useRole();
  const canWrite = can(role, "evaluations.write");
  const qc = useQueryClient();
  const { data: staff = [] } = useQuery({ queryKey: ["staff"], queryFn: () => listStaff(), enabled: canWrite });
  const { data: cfg } = useQuery({ queryKey: ["grades"], queryFn: () => getGradeConfig() });
  const { data: evals = [], isLoading } = useQuery({ queryKey: ["evaluations"], queryFn: () => listEvaluations() });

  const [staffId, setStaffId] = useState("");
  const [month, setMonth] = useState(firstOfMonth());
  const [scores, setScores] = useState({ sales: 80, attendance: 90, achievements: 70, review: 80, discipline: 90, kpi: 75 });
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () => submitEvaluation({ data: {
      staff_id: staffId, month, notes,
      sales_score: scores.sales,
      attendance_score: scores.attendance,
      achievements_score: scores.achievements,
      review_score: scores.review,
      discipline_score: scores.discipline,
      kpi_score: scores.kpi,
    } }),
    onSuccess: () => { setMsg("1111 recorded."); qc.invalidateQueries({ queryKey: ["evaluations"] }); },
    onError: (e: any) => setMsg(e.message ?? "Failed"),
  });
  const del = useMutation({ mutationFn: (id: string) => deleteEvaluation({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["evaluations"] }) });

  const w = {
    sales_w: cfg?.weights?.sales_w ?? 30,
    attendance_w: cfg?.weights?.attendance_w ?? 15,
    achievements_w: cfg?.weights?.achievements_w ?? 15,
    review_w: cfg?.weights?.review_w ?? 15,
    discipline_w: cfg?.weights?.discipline_w ?? 10,
    kpi_w: cfg?.weights?.kpi_w ?? 15,
  };
  const composite = useMemo(() => computeComposite(scores, w), [scores, w]);
  const projectedGrade = useMemo(() => {
    const sorted = [...(cfg?.rules ?? [])].sort((a: any, b: any) => b.min_score - a.min_score);
    for (const r of sorted) if (composite >= r.min_score) return r.grade;
    return "D";
  }, [cfg, composite]);

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">1111</div>
            <div className="text-xs text-muted-foreground">
              Grade Engine: 6 factors, weighted average. Edit weights in Admin → Grades.
            </div>
          </div>
          <Link to="/" className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">← Dashboard</Link>
        </header>

        {canWrite ? (
          <section className="rounded-md border border-border bg-ink/30 p-5">
            <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">Submit 1111</h2>
            <form onSubmit={(e) => { e.preventDefault(); if (staffId) submit.mutate(); }} className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Team Member</span>
                <select className={inputCls} value={staffId} onChange={e => setStaffId(e.target.value)} required>
                  <option value="">— Select —</option>
                  {staff.map((s: any) => <option key={s.id} value={s.id}>{s.name} · {s.role}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Month</span>
                <input type="month" className={inputCls}
                  value={month.slice(0,7)} onChange={e => setMonth(`${e.target.value}-01`)} required />
              </label>

              {FACTORS.map(f => {
                const wt = (w as any)[`${f.key}_w`] as number;
                return (
                  <label key={f.key} className="block">
                    <span className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                      <span>{f.label}</span>
                      <span className="text-gold/70">weight {wt}</span>
                    </span>
                    <input type="number" min={0} max={100} className={inputCls}
                      value={(scores as any)[f.key]}
                      onChange={e => setScores({ ...scores, [f.key]: Number(e.target.value) })} />
                    <span className="mt-1 block text-[10px] italic text-muted-foreground">{f.hint}</span>
                  </label>
                );
              })}

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Captain Notes</span>
                <textarea rows={2} className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} />
              </label>

              <div className="sm:col-span-2 flex items-center justify-between rounded-md border border-gold/30 bg-gold/5 px-3 py-2">
                <div className="text-xs text-muted-foreground">
                  Performance Score preview: <span className="text-gold">{composite}</span>
                </div>
                <div className="font-display text-xs uppercase tracking-widest" style={{ color: GRADE_META[projectedGrade as "A"].color }}>
                  Grade {projectedGrade} · {GRADE_META[projectedGrade as "A"].label}
                </div>
              </div>
              {msg && <div className="sm:col-span-2 rounded border border-gold/30 bg-gold/5 px-3 py-2 text-xs text-gold">{msg}</div>}
              <div className="sm:col-span-2 flex justify-end">
                <button type="submit" disabled={submit.isPending || !staffId}
                  className="rounded-md border border-gold bg-gold/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-gold hover:bg-gold/20 disabled:opacity-50">
                  {submit.isPending ? "Saving…" : "Save Evaluation"}
                </button>
              </div>
            </form>
          </section>
        ) : (
          <div className="rounded-md border border-border bg-ink/30 p-5 text-xs text-muted-foreground">
            Only Managers and Directors can submit 1111. You can view your own grades below.
          </div>
        )}

        <section className="mt-8 rounded-md border border-border bg-ink/30 p-5">
          <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">Review History</h2>
          {isLoading ? <div className="py-4 text-xs text-muted-foreground">Loading…</div> : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3">Month</th><th className="py-2 pr-3">Team Member</th>
                    <th className="py-2 pr-3">Sales</th><th className="py-2 pr-3">Att.</th>
                    <th className="py-2 pr-3">Ach.</th><th className="py-2 pr-3">Rev.</th>
                    <th className="py-2 pr-3">Disc.</th><th className="py-2 pr-3">KPI</th>
                    <th className="py-2 pr-3">Rating</th><th className="py-2 pr-3">Grade</th>
                    {canWrite && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {evals.map((e: any) => (
                    <tr key={e.id} className="border-b border-border/40">
                      <td className="py-2 pr-3">{e.month}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{e.staff?.name}</td>
                      <td className="py-2 pr-3">{e.sales_score}</td>
                      <td className="py-2 pr-3">{e.attendance_score ?? 0}</td>
                      <td className="py-2 pr-3">{e.achievements_score ?? 0}</td>
                      <td className="py-2 pr-3">{e.review_score}</td>
                      <td className="py-2 pr-3">{e.discipline_score ?? 0}</td>
                      <td className="py-2 pr-3">{e.kpi_score ?? 0}</td>
                      <td className="py-2 pr-3 text-gold">{e.composite_score}</td>
                      <td className="py-2 pr-3">
                        <span className="rounded px-2 py-0.5 text-xs font-bold" style={{ color: GRADE_META[e.grade as "A"].color, borderColor: GRADE_META[e.grade as "A"].color, borderWidth: 1 }}>{e.grade}</span>
                      </td>
                      {canWrite && <td className="py-2 pr-3 text-right">
                        <button onClick={() => del.mutate(e.id)} className="text-xs uppercase tracking-widest text-red-300 hover:text-red-200">Delete</button>
                      </td>}
                    </tr>
                  ))}
                  {!evals.length && <tr><td colSpan={canWrite ? 11 : 10} className="py-6 text-center text-xs text-muted-foreground">No evaluations yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
