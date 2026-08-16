import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AuthGate } from "@/components/auth-gate";
import {
  getPerformanceOverview,
  type PerformanceMonthRecord,
} from "@/lib/reviews.functions";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "Monthly Performance — The Odyssey Guide" },
      { name: "description", content: "Your monthly ABCD grade, score, category breakdown, manager notes, and review history." },
    ],
  }),
  component: () => <AuthGate><PerformancePage /></AuthGate>,
});

// ─── Frozen Odyssey model: 50 Class + 50 Guild = 100 ───────────────
const SALES_TARGET = 50000;

const GRADE_INFO: Record<"A" | "B" | "C" | "D", { title: string; blurb: string; color: string; glow: string }> = {
  A: { title: "Alpha",          blurb: "A voyage worthy of song.",                     color: "#F5D07A", glow: "shadow-[0_0_60px_-10px_rgba(245,208,122,0.55)]" },
  B: { title: "Beta",           blurb: "Steady hands, steady sails.",                  color: "#A8C8FF", glow: "shadow-[0_0_60px_-10px_rgba(168,200,255,0.45)]" },
  C: { title: "Certified",      blurb: "The required standard for this role is met.",  color: "#C8CDD4", glow: "shadow-[0_0_60px_-10px_rgba(200,205,212,0.35)]" },
  D: { title: "Below Standard", blurb: "Return to harbor. Rebuild. Sail again.",       color: "#E07070", glow: "shadow-[0_0_60px_-10px_rgba(224,112,112,0.45)]" },
};

const GRADE_REFERENCE: { grade: "A" | "B" | "C" | "D"; short: string }[] = [
  { grade: "A", short: "Alpha · 90–100" },
  { grade: "B", short: "Beta · 80–89" },
  { grade: "C", short: "Certified · 60–79" },
  { grade: "D", short: "Below Standard" },
];

function GradeReference() {
  return (
    <section className="mt-6 rounded-xl border border-border bg-ink/20 p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">Grade Meaning</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Reference</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {GRADE_REFERENCE.map((g) => {
          const gi = GRADE_INFO[g.grade];
          return (
            <div
              key={g.grade}
              className="rounded-lg border p-4 text-center"
              style={{ borderColor: `${gi.color}44`, background: `${gi.color}08` }}
            >
              <div className="font-display text-4xl" style={{ color: gi.color }}>{g.grade}</div>
              <div className="mt-1 font-display text-xs uppercase tracking-widest" style={{ color: gi.color }}>
                {g.short}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PerformancePage() {
  const fetchOverview = useServerFn(getPerformanceOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["performance-overview"],
    queryFn: () => fetchOverview({ data: {} }),
  });

  const current = data?.current ?? null;
  const history = data?.history ?? [];
  const info = current ? GRADE_INFO[current.grade] : null;
  const notes = (current?.notes ?? "")
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">
              Monthly Performance
            </div>
            <div className="text-xs text-muted-foreground">
              {current ? `${current.label} · How am I performing this month?` : "How am I performing this month?"}
            </div>
          </div>
          <Link
            to="/"
            className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
          >
            ← Dashboard
          </Link>
        </header>

        {isLoading && (
          <div className="rounded-xl border border-border bg-ink/30 p-10 text-center text-sm text-muted-foreground">
            Loading your performance records…
          </div>
        )}

        {!isLoading && !current && (
          <section className="rounded-2xl border border-border bg-ink/30 p-10 text-center">
            <div className="font-display text-xl uppercase tracking-[0.3em] text-gold">No Reviews Yet</div>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Your monthly grade appears here once your manager submits a Performance Review.
              Ranking reads the same records, so nothing is shown until real data exists.
            </p>
            <Link
              to="/professional-performance"
              className="mt-6 inline-block rounded-md border border-gold/40 px-4 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/10"
            >
              Open Performance Review
            </Link>
          </section>
        )}

        {current && info && (
          <>
            {/* 1. Current Grade — hero */}
            <section
              className={`relative overflow-hidden rounded-2xl border bg-ink/40 p-8 sm:p-12 ${info.glow}`}
              style={{ borderColor: `${info.color}55` }}
            >
              <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{
                background: `radial-gradient(circle at 30% 20%, ${info.color}, transparent 60%)`,
              }} />
              <div className="relative flex flex-col items-center text-center">
                <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                  Current Grade · {current.label}
                </div>
                <div
                  className="mt-4 font-display text-[7rem] leading-none sm:text-[9rem]"
                  style={{ color: info.color, textShadow: `0 0 40px ${info.color}66` }}
                >
                  {current.grade}
                </div>
                <div className="mt-2 font-display text-2xl uppercase tracking-[0.3em]" style={{ color: info.color }}>
                  {info.title}
                </div>
                <div className="mt-3 max-w-md text-sm italic text-muted-foreground">"{info.blurb}"</div>
              </div>
            </section>

            {/* 2. Total Performance */}
            <section className="mt-6 rounded-xl border border-border bg-ink/30 p-6">
              <div className="flex items-baseline justify-between">
                <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">Total Performance</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Class 50 + Guild 50</div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div className="font-display text-5xl text-foreground">
                  {current.total}
                  <span className="text-2xl text-muted-foreground"> / 100</span>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>Class Performance <span className="text-gold">{current.class_points.toFixed(1)} / 50</span></div>
                  <div>Guild Performance <span className="text-gold">{current.guild_points.toFixed(1)} / 50</span></div>
                </div>
              </div>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full border border-border bg-ink/60">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, current.total)}%`,
                    background: `linear-gradient(90deg, ${info.color}88, ${info.color})`,
                    boxShadow: `0 0 12px ${info.color}88`,
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>D · 0</span><span>C · 60</span><span>B · 80</span><span>A · 90</span><span>100</span>
              </div>
            </section>

            {/* 3a. Class Performance */}
            <section className="mt-6 rounded-xl border border-border bg-ink/30 p-6">
              <div className="mb-5 flex items-baseline justify-between">
                <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">Class Performance · Sales</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Max 50 points</div>
              </div>
              <div className="rounded-lg border border-border/60 bg-ink/40 p-4">
                <div className="flex items-baseline justify-between">
                  <div className="font-display text-sm uppercase tracking-widest text-foreground">Sales</div>
                  <div className="font-display text-lg text-gold">{current.class_points.toFixed(1)} / 50</div>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/60">
                  <div className="h-full rounded-full bg-gold/80" style={{ width: `${(current.class_points / 50) * 100}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>{Math.round((current.class_points / 50) * 100)}% of target achieved</span>
                  <span>Target RM {SALES_TARGET.toLocaleString()}</span>
                </div>
              </div>
            </section>

            {/* 3b. Guild Performance */}
            <section className="mt-6 rounded-xl border border-border bg-ink/30 p-6">
              <div className="mb-5 flex items-baseline justify-between">
                <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">Guild Performance · Behaviour</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">4 dimensions · 12.5 pts each</div>
              </div>
              <div className="space-y-4">
                {current.behaviours.map((c) => {
                  const stars = Math.round(c.percent / 20);
                  const earned = (c.percent / 100) * 12.5;
                  return (
                    <div key={c.key} className="rounded-lg border border-border/60 bg-ink/40 p-4">
                      <div className="flex items-baseline justify-between">
                        <div className="font-display text-sm uppercase tracking-widest text-foreground">{c.name}</div>
                        <div className="font-display text-lg text-gold">
                          {"★".repeat(Math.max(0, Math.min(5, stars)))}
                          <span className="text-muted-foreground/50">{"★".repeat(Math.max(0, 5 - stars))}</span>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/60">
                        <div className="h-full rounded-full bg-gold/80" style={{ width: `${Math.min(100, c.percent)}%` }} />
                      </div>
                      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                        <span>{Math.round(c.percent)}%{stars === 3 ? " · Meets Standard" : ""}</span>
                        <span>{earned.toFixed(2)} / 12.5 pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-end border-t border-border/50 pt-3 text-xs text-muted-foreground">
                Guild Performance:{" "}
                <span className="ml-2 font-display text-gold">{current.guild_points.toFixed(2)} / 50</span>
              </div>
            </section>

            {/* 4. Manager Notes */}
            {notes.length > 0 && (
              <section className="mt-6 rounded-xl border border-border bg-ink/30 p-6">
                <div className="flex items-baseline justify-between">
                  <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">Manager Notes</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{current.label}</div>
                </div>
                <ul className="mt-4 space-y-3">
                  {notes.map((n, i) => (
                    <li key={i} className="relative rounded-lg border-l-2 border-gold/40 bg-ink/40 px-4 py-3 text-sm text-foreground/90">
                      <span className="mr-2 text-gold">❝</span>
                      {n}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 5. History — real submitted reviews only */}
            <section className="mt-6 rounded-xl border border-border bg-ink/30 p-6">
              <div className="mb-4 flex items-baseline justify-between">
                <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">Review History</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {history.length} submitted review{history.length === 1 ? "" : "s"}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {history.map((h: PerformanceMonthRecord, idx: number) => {
                  const gi = GRADE_INFO[h.grade];
                  const isCurrent = idx === 0;
                  return (
                    <div
                      key={h.month}
                      className={`rounded-lg border p-4 ${isCurrent ? "border-gold/50 bg-gold/5" : "border-border bg-ink/40"}`}
                    >
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{h.label}</div>
                      <div className="mt-2 flex items-baseline justify-between">
                        <div className="font-display text-4xl" style={{ color: gi.color }}>{h.grade}</div>
                        <div className="text-right">
                          <div className="text-xs text-foreground">{h.total} / 100</div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{gi.title}</div>
                        </div>
                      </div>
                      {isCurrent && (
                        <div className="mt-2 text-[10px] uppercase tracking-widest text-gold">● Latest review</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 border-t border-border/50 pt-3 text-right text-[10px] uppercase tracking-widest text-muted-foreground">
                <Link to="/promotions" className="hover:text-gold">Ranking reads these same records →</Link>
              </div>
            </section>
          </>
        )}

        <GradeReference />
      </div>
    </div>
  );
}
