import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthGate } from "@/components/auth-gate";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "Monthly Performance — The Odyssey Guide" },
      { name: "description", content: "Your monthly ABCD grade, score, category breakdown, manager notes, and voyage history." },
    ],
  }),
  component: () => <AuthGate><PerformancePage /></AuthGate>,
});

// ─── Placeholder data ──────────────────────────────────────────────
const CURRENT = {
  month: "August",
  year: 2026,
  grade: "B" as const,
  score: 86,
  categories: [
    { name: "Sales",       percent: 90,  weight: 30, earned: 27.0 },
    { name: "Attendance",  percent: 100, weight: 15, earned: 15.0 },
    { name: "Teamwork",    percent: 85,  weight: 15, earned: 12.75 },
    { name: "SOP",         percent: 70,  weight: 20, earned: 14.0 },
    { name: "Leadership",  percent: 60,  weight: 10, earned: 6.0 },
    { name: "Discipline",  percent: 92,  weight: 10, earned: 9.2 },
  ],
  managerNotes: [
    "Excellent customer handling this month — several guest compliments logged.",
    "Needs stronger SOP discipline, especially closing checklists.",
    "Keep mentoring the new Ranger recruits — it's showing.",
  ],
  captain: "Elder Ryu",
};

const HISTORY = [
  { month: "May 2026",    grade: "A", score: 93, status: "Sealed" },
  { month: "June 2026",   grade: "B", score: 84, status: "Sealed" },
  { month: "July 2026",   grade: "A", score: 91, status: "Sealed" },
  { month: "August 2026", grade: "B", score: 86, status: "Current" },
  { month: "September 2026", grade: null, score: null, status: "Pending" },
];

const GRADE_INFO: Record<"A" | "B" | "C" | "D", { title: string; blurb: string; color: string; glow: string }> = {
  A: { title: "Outstanding",           blurb: "A voyage worthy of song.",                color: "#F5D07A", glow: "shadow-[0_0_60px_-10px_rgba(245,208,122,0.55)]" },
  B: { title: "Consistent",            blurb: "Steady hands, steady sails.",             color: "#A8C8FF", glow: "shadow-[0_0_60px_-10px_rgba(168,200,255,0.45)]" },
  C: { title: "Needs Improvement",     blurb: "Winds shifting — adjust the course.",     color: "#E9A26A", glow: "shadow-[0_0_60px_-10px_rgba(233,162,106,0.45)]" },
  D: { title: "Performance Recovery",  blurb: "Return to harbor. Rebuild. Sail again.",  color: "#E07070", glow: "shadow-[0_0_60px_-10px_rgba(224,112,112,0.45)]" },
};

const GRADE_REFERENCE: { grade: "A" | "B" | "C" | "D"; short: string }[] = [
  { grade: "A", short: "Outstanding" },
  { grade: "B", short: "Reliable" },
  { grade: "C", short: "Needs Improvement" },
  { grade: "D", short: "Performance Recovery" },
];

function PerformancePage() {
  const info = GRADE_INFO[CURRENT.grade];

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
              {CURRENT.month} {CURRENT.year} · How am I performing this month?
            </div>
          </div>
          <Link
            to="/"
            className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
          >
            ← Ledger
          </Link>
        </header>

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
              Current Grade · {CURRENT.month}
            </div>
            <div
              className="mt-4 font-display text-[7rem] leading-none sm:text-[9rem]"
              style={{ color: info.color, textShadow: `0 0 40px ${info.color}66` }}
            >
              {CURRENT.grade}
            </div>
            <div className="mt-2 font-display text-2xl uppercase tracking-[0.3em]" style={{ color: info.color }}>
              {info.title}
            </div>
            <div className="mt-3 max-w-md text-sm italic text-muted-foreground">
              "{info.blurb}"
            </div>
          </div>
        </section>

        {/* 2. Monthly Score */}
        <section className="mt-6 rounded-xl border border-border bg-ink/30 p-6">
          <div className="flex items-baseline justify-between">
            <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">
              Monthly Score
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Determines this month's grade
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div className="font-display text-5xl text-foreground">
              {CURRENT.score}
              <span className="text-2xl text-muted-foreground"> / 100</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Next tier at <span className="text-gold">90</span> → Grade A
            </div>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full border border-border bg-ink/60">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${CURRENT.score}%`,
                background: `linear-gradient(90deg, ${info.color}88, ${info.color})`,
                boxShadow: `0 0 12px ${info.color}88`,
              }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>D · 0</span>
            <span>C · 60</span>
            <span>B · 75</span>
            <span>A · 90</span>
            <span>100</span>
          </div>
        </section>

        {/* 3. Performance Breakdown */}
        <section className="mt-6 rounded-xl border border-border bg-ink/30 p-6">
          <div className="mb-5 flex items-baseline justify-between">
            <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">
              Performance Breakdown
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              6 categories · weighted
            </div>
          </div>
          <div className="space-y-4">
            {CURRENT.categories.map((c) => (
              <div key={c.name} className="rounded-lg border border-border/60 bg-ink/40 p-4">
                <div className="flex items-baseline justify-between">
                  <div className="font-display text-sm uppercase tracking-widest text-foreground">
                    {c.name}
                  </div>
                  <div className="font-display text-lg text-gold">{c.percent}%</div>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/60">
                  <div
                    className="h-full rounded-full bg-gold/80"
                    style={{ width: `${c.percent}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>Weight {c.weight}%</span>
                  <span>Earned {c.earned.toFixed(2)} pts</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end border-t border-border/50 pt-3 text-xs text-muted-foreground">
            Total earned:{" "}
            <span className="ml-2 font-display text-gold">
              {CURRENT.categories.reduce((a, c) => a + c.earned, 0).toFixed(2)} / 100
            </span>
          </div>
        </section>

        {/* 4. Manager Notes */}
        <section className="mt-6 rounded-xl border border-border bg-ink/30 p-6">
          <div className="flex items-baseline justify-between">
            <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">
              Captain's Notes
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              From {CURRENT.captain}
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {CURRENT.managerNotes.map((n, i) => (
              <li
                key={i}
                className="relative rounded-lg border-l-2 border-gold/40 bg-ink/40 px-4 py-3 text-sm text-foreground/90"
              >
                <span className="mr-2 text-gold">❝</span>
                {n}
              </li>
            ))}
          </ul>
        </section>

        {/* 5. History */}
        <section className="mt-6 rounded-xl border border-border bg-ink/30 p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">
              Voyage History
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Previous monthly grades
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {HISTORY.map((h) => {
              const gi = h.grade ? GRADE_INFO[h.grade as "A"] : null;
              const isCurrent = h.status === "Current";
              const isPending = h.status === "Pending";
              return (
                <div
                  key={h.month}
                  className={`rounded-lg border p-4 ${
                    isCurrent ? "border-gold/50 bg-gold/5" : "border-border bg-ink/40"
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {h.month}
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    {isPending ? (
                      <>
                        <div className="font-display text-3xl text-muted-foreground/50">—</div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Pending
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          className="font-display text-4xl"
                          style={{ color: gi!.color }}
                        >
                          {h.grade}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-foreground">{h.score} / 100</div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            {gi!.title}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {isCurrent && (
                    <div className="mt-2 text-[10px] uppercase tracking-widest text-gold">
                      ● Current voyage
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. Grade Meaning */}
        <section className="mt-6 rounded-xl border border-border bg-ink/20 p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">
              Grade Meaning
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Reference
            </div>
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
                  <div
                    className="font-display text-4xl"
                    style={{ color: gi.color }}
                  >
                    {g.grade}
                  </div>
                  <div
                    className="mt-1 font-display text-xs uppercase tracking-widest"
                    style={{ color: gi.color }}
                  >
                    {g.short}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-8 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          Placeholder data · will bind to Voyage Review records
        </div>
      </div>
    </div>
  );
}
