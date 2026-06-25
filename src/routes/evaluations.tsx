import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { useRole, can } from "@/lib/roles";
import { GRADE_META } from "@/lib/employee-data";
import { listStaff, getGradeConfig } from "@/lib/server/config.functions";
import { listEvaluations, submitEvaluation, deleteEvaluation } from "@/lib/server/evaluations.functions";

export const Route = createFileRoute("/evaluations")({
  head: () => ({ meta: [{ title: "Monthly Evaluations — Guild Ledger" }] }),
  component: () => <AuthGate><EvaluationsPage /></AuthGate>,
});

const inputCls = "w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none";

function firstOfMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function EvaluationsPage() {
  const { role } = useRole();
  const canWrite = can(role, "evaluations.write");
  const qc = useQueryClient();
  const { data: staff = [] } = useQuery({ queryKey: ["staff"], queryFn: () => listStaff() });
  const { data: cfg } = useQuery({ queryKey: ["grades"], queryFn: () => getGradeConfig() });
  const { data: evals = [], isLoading } = useQuery({ queryKey: ["evaluations"], queryFn: () => listEvaluations() });

  const [staffId, setStaffId] = useState("");
  const [month, setMonth] = useState(firstOfMonth());
  const [sales, setSales] = useState(80);
  const [review, setReview] = useState(80);
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () => submitEvaluation({ data: { staff_id: staffId, month, sales_score: sales, review_score: review, notes } }),
    onSuccess: () => { setMsg("Evaluation recorded."); qc.invalidateQueries({ queryKey: ["evaluations"] }); },
    onError: (e: any) => setMsg(e.message ?? "Failed"),
  });
  const del = useMutation({ mutationFn: (id: string) => deleteEvaluation({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["evaluations"] }) });

  const w = cfg?.weights ?? { sales_weight: 60, review_weight: 40 };
  const composite = +(sales * w.sales_weight / 100 + review * w.review_weight / 100).toFixed(2);
  const projectedGrade = (() => {
    const sorted = [...(cfg?.rules ?? [])].sort((a: any, b: any) => b.min_score - a.min_score);
    for (const r of sorted) if (composite >= r.min_score) return r.grade;
    return "D";
  })();

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">Monthly Evaluations</div>
            <div className="text-xs text-muted-foreground">
              Composite = Sales × {w.sales_weight}% + Reviews × {w.review_weight}% · Grade by configured thresholds.
            </div>
          </div>
          <Link to="/" className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">← Ledger</Link>
        </header>

        {canWrite ? (
          <section className="rounded-md border border-border bg-ink/30 p-5">
            <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">Submit Evaluation</h2>
            <form onSubmit={(e) => { e.preventDefault(); if (staffId) submit.mutate(); }} className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Staff</span>
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
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Sales Score (0–100)</span>
                <input type="number" min={0} max={100} className={inputCls} value={sales} onChange={e => setSales(Number(e.target.value))} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Review Score (0–100)</span>
                <input type="number" min={0} max={100} className={inputCls} value={review} onChange={e => setReview(Number(e.target.value))} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Notes</span>
                <textarea rows={2} className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} />
              </label>
              <div className="sm:col-span-2 flex items-center justify-between rounded-md border border-gold/30 bg-gold/5 px-3 py-2">
                <div className="text-xs text-muted-foreground">
                  Composite preview: <span className="text-gold">{composite}</span>
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
            Only Managers and Directors can submit evaluations. You can view your own grades below.
          </div>
        )}

        <section className="mt-8 rounded-md border border-border bg-ink/30 p-5">
          <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">Evaluation Records</h2>
          {isLoading ? <div className="py-4 text-xs text-muted-foreground">Loading…</div> : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3">Month</th><th className="py-2 pr-3">Staff</th>
                    <th className="py-2 pr-3">Sales</th><th className="py-2 pr-3">Review</th>
                    <th className="py-2 pr-3">Composite</th><th className="py-2 pr-3">Grade</th>
                    <th className="py-2 pr-3">Notes</th>{canWrite && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {evals.map((e: any) => (
                    <tr key={e.id} className="border-b border-border/40">
                      <td className="py-2 pr-3">{e.month}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{e.staff?.name}</td>
                      <td className="py-2 pr-3">{e.sales_score}</td>
                      <td className="py-2 pr-3">{e.review_score}</td>
                      <td className="py-2 pr-3">{e.composite_score}</td>
                      <td className="py-2 pr-3">
                        <span className="rounded px-2 py-0.5 text-xs font-bold" style={{ color: GRADE_META[e.grade as "A"].color, borderColor: GRADE_META[e.grade as "A"].color, borderWidth: 1 }}>{e.grade}</span>
                      </td>
                      <td className="py-2 pr-3 text-xs italic text-muted-foreground">{e.notes}</td>
                      {canWrite && <td className="py-2 pr-3 text-right">
                        <button onClick={() => del.mutate(e.id)} className="text-xs uppercase tracking-widest text-red-300 hover:text-red-200">Delete</button>
                      </td>}
                    </tr>
                  ))}
                  {!evals.length && <tr><td colSpan={canWrite ? 8 : 7} className="py-6 text-center text-xs text-muted-foreground">No evaluations yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
