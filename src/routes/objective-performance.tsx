import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import {
  getMyObjectivePerformance,
  setMyObjectiveTarget,
  type ObjectivePerformance,
} from "@/lib/objective.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/objective-performance")({
  head: () => ({
    meta: [
      { title: "Objective Performance — The Odyssey Guide" },
      { name: "description", content: "Live monthly objective progress driven by approved Daily Sales Claims." },
    ],
  }),
  component: () => (
    <AuthGate>
      <ObjectivePage />
    </AuthGate>
  ),
});

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function ObjectivePage() {
  const qc = useQueryClient();
  const [month, setMonth] = useState<string>(monthKey());

  const { data, isLoading, error } = useQuery<ObjectivePerformance>({
    queryKey: ["objective", month],
    queryFn: () => getMyObjectivePerformance({ data: { month } }),
    // Approved claims post live — re-check as changes come in.
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  // Realtime: refetch when any daily_sales_claims row for me changes.
  useEffect(() => {
    const ch = supabase
      .channel("objective-daily-sales")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_sales_claims" },
        () => qc.invalidateQueries({ queryKey: ["objective"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.35em] text-gold/70">
              Performance · Objective Engine
            </div>
            <h1
              className="mt-1 text-2xl uppercase tracking-wide sm:text-3xl"
              style={{ fontFamily: "'Cinzel', serif", color: "#E5E7EB", textShadow: "0 0 30px rgba(212,168,75,0.35)" }}
            >
              Objective Performance
            </h1>
            <p className="mt-1 text-xs italic text-muted-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Only approved records count. Live progress toward your monthly objective.
            </p>
          </div>
          <Link
            to="/"
            className="rounded-md border border-border px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
          >
            ← Home
          </Link>
        </header>

        <div className="mb-4 flex items-center gap-3">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Month</label>
          <input
            type="month"
            value={month}
            max={monthKey()}
            onChange={(e) => setMonth(e.target.value || monthKey())}
            className="rounded-md border border-border bg-ink/60 px-3 py-1.5 text-sm text-foreground focus:border-gold focus:outline-none"
          />
        </div>

        {isLoading ? (
          <div className="rounded-md border border-border bg-ink/30 p-8 text-center text-xs text-muted-foreground">
            Loading…
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-200">
            {(error as Error).message}
          </div>
        ) : data ? (
          <div className="space-y-6">
            <ObjectiveCard data={data} />
            {data.implemented ? <MonthlyHistory data={data} /> : <NotYetImplemented data={data} />}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function fmtValue(n: number, data: ObjectivePerformance) {
  if (data.unit === "currency") {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: data.currency ?? "MYR",
      maximumFractionDigits: 2,
    }).format(n);
  }
  if (data.unit === "percent") return `${n.toFixed(1)}%`;
  return new Intl.NumberFormat().format(n);
}
function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "2-digit",
  });
}
function fmtTs(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function ObjectiveCard({ data }: { data: ObjectivePerformance }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(String(data.target));
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { setDraft(String(data.target)); }, [data.target]);

  const save = useMutation({
    mutationFn: () => setMyObjectiveTarget({
      data: {
        month: data.month,
        objective_type: data.objective_type,
        target_amount: Number(draft),
      },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["objective"] });
      setEditing(false);
      setMsg(null);
    },
    onError: (e: any) => setMsg(e?.message ?? "Failed."),
  });

  const pct = Math.max(0, data.progress_pct);
  const barWidth = Math.min(100, pct);
  const overshoot = pct > 100;

  return (
    <section
      className="rounded-md border p-6 shadow-[0_0_60px_rgba(212,168,75,0.08)]"
      style={{ borderColor: "rgba(197,160,89,0.25)", background: "#0A0F1E" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-display text-[10px] uppercase tracking-[0.3em] text-gold/70">Objective</div>
          <div
            className="mt-1 text-xl uppercase tracking-wide"
            style={{ fontFamily: "'Cinzel', serif", color: "#E5E7EB" }}
          >
            {data.objective_label}
          </div>
          {data.primary_class && (
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {data.primary_class} · {data.primary_role ?? "—"}
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="font-display text-[10px] uppercase tracking-[0.3em] text-gold/70">Target</div>
          {!editing ? (
            <div className="mt-1 flex items-center justify-end gap-2">
              <span className="font-display text-lg text-foreground">{fmtValue(data.target, data)}</span>
              <button
                onClick={() => setEditing(true)}
                className="rounded border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-32 rounded-md border border-border bg-ink/60 px-2 py-1 text-right text-sm text-foreground focus:border-gold focus:outline-none"
              />
              <button
                disabled={save.isPending}
                onClick={() => save.mutate()}
                className="rounded border border-gold bg-gold/10 px-2 py-1 font-display text-[10px] uppercase tracking-widest text-gold hover:bg-gold/20 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => { setEditing(false); setDraft(String(data.target)); setMsg(null); }}
                className="rounded border border-border px-2 py-1 font-display text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
              >
                Cancel
              </button>
            </div>
          )}
          {msg && <div className="mt-1 text-[10px] text-red-300">{msg}</div>}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatBox label="Approved Sales" value={fmtValue(data.approved_total, data)} tone="gold" />
        <StatBox label="Progress" value={`${data.progress_pct.toFixed(1)}%`} tone={overshoot ? "emerald" : "gold"} />
        <StatBox
          label="Remaining"
          value={fmtValue(Math.max(0, data.target - data.approved_total), data)}
          tone="muted"
        />
      </div>

      <div className="mt-5">
        <div className="h-3 w-full overflow-hidden rounded-full border border-border bg-ink/60">
          <div
            className={`h-full transition-all duration-500 ${
              overshoot
                ? "bg-gradient-to-r from-emerald-400 to-emerald-200"
                : "bg-gradient-to-r from-gold/70 to-gold"
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>0</span>
          <span>{fmtValue(data.target, data)}</span>
        </div>
      </div>
    </section>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string; tone: "gold" | "emerald" | "muted" }) {
  const cls =
    tone === "emerald" ? "text-emerald-300"
    : tone === "muted" ? "text-muted-foreground"
    : "text-gold";
  return (
    <div className="rounded-md border border-border bg-ink/40 px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-lg ${cls}`}>{value}</div>
    </div>
  );
}

function MonthlyHistory({ data }: { data: ObjectivePerformance }) {
  const rows = data.history;
  const totalApproved = data.approved_total;

  return (
    <section className="rounded-md border border-border bg-ink/30 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">Approved This Month</h2>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {rows.length} record{rows.length === 1 ? "" : "s"}
        </div>
      </div>

      {!rows.length ? (
        <div className="py-10 text-center text-xs text-muted-foreground">
          No approved records yet this month.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-right">Approved</th>
                <th className="px-3 py-2 text-left">Approved At</th>
                <th className="px-3 py-2 text-left">Approved By</th>
                <th className="px-3 py-2 text-right">Running Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 text-foreground">{fmtDate(r.sales_date)}</td>
                  <td className="px-3 py-2 text-right font-display text-gold">{fmtValue(r.amount, data)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtTs(r.reviewed_at)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.reviewer_name ?? "—"}</td>
                  <td className="px-3 py-2 text-right font-display text-foreground">{fmtValue(r.running_total, data)}</td>
                </tr>
              ))}
              <tr className="bg-ink/50">
                <td className="px-3 py-2 font-display text-[10px] uppercase tracking-widest text-muted-foreground" colSpan={4}>
                  Monthly total
                </td>
                <td className="px-3 py-2 text-right font-display text-gold">{fmtValue(totalApproved, data)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function NotYetImplemented({ data }: { data: ObjectivePerformance }) {
  return (
    <section className="rounded-md border border-border bg-ink/30 p-6 text-center">
      <div className="font-display text-sm uppercase tracking-[0.25em] text-gold">
        {data.objective_label} · Coming Soon
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        The Objective Engine for this Primary Class is scaffolded. Metric resolvers land in a future release.
      </p>
    </section>
  );
}
