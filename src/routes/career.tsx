import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthGate } from "@/components/auth-gate";

export const Route = createFileRoute("/career")({
  head: () => ({
    meta: [
      { title: "Main Career — The Odyssey Guide" },
      { name: "description", content: "The home of your primary profession — powered by the Performance and Ranking systems." },
    ],
  }),
  component: () => <AuthGate><CareerPage /></AuthGate>,
});

// ─── Placeholder data ──────────────────────────────────────────────
const HEADER = {
  name: "Ryu Lai",
  profession: "Sales Ambassador",
  className: "Ranger · Hunter",
  rank: "Bronze Hunter",
  businessUnit: "Sales",
  tagline: "I Can Do It.",
};

const PERFORMANCE = {
  grade: "B" as "A" | "B" | "C" | "D",
  gradeLabel: "Consistent",
  score: 82,
  month: "November 2026",
  summary: "Steady voyage this month. Sales and attendance held strong; teamwork trending upward. One SOP note pending Captain review.",
};

const RANKING = {
  current: "Bronze Hunter",
  next: "Silver Hunter",
  journeyPct: 62,
  requirements: [
    { label: "Tenure at rank",       current: "4 mo",  target: "6 mo",  done: false },
    { label: "Monthly Reviews",      current: "3 / 6", target: "6",     done: false },
    { label: "Grade B streak",       current: "3 mo",  target: "3 mo",  done: true },
    { label: "Grade A achieved",     current: "1 mo",  target: "1 mo",  done: true },
    { label: "Achievements approved", current: "8 / 12", target: "12",  done: false },
    { label: "Captain endorsement",  current: "Pending", target: "1",   done: false },
  ],
};

const JOURNEY = [
  { key: "apprentice", name: "Apprentice",     glyph: "⚓" },
  { key: "bronze",     name: "Bronze Hunter",  glyph: "🥉" },
  { key: "silver",     name: "Silver Hunter",  glyph: "🥈" },
  { key: "gold",       name: "Gold Hunter",    glyph: "🥇" },
  { key: "black",      name: "Black Hunter",   glyph: "🖤" },
  { key: "legend",     name: "Legend",         glyph: "☀" },
];
const CURRENT_KEY = "bronze";

const STATS = {
  yearsServed: "2y 3m",
  totalPromotions: 2,
  currentLegacy: "3 ★ · 0 ☾ · 0 ☀",
  careerStarted: "Aug 2024",
};

const gradeReqDone = RANKING.requirements.filter(r => r.done).length;
const gradeReqTotal = RANKING.requirements.length;
const currentIdx = JOURNEY.findIndex(j => j.key === CURRENT_KEY);

function CareerPage() {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top nav */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">
              Main Career
            </div>
            <div className="text-xs text-muted-foreground">
              Your primary profession — Performance & Ranking
            </div>
          </div>
          <Link
            to="/"
            className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
          >
            ← Ledger
          </Link>
        </header>

        {/* 1 · CAREER HEADER */}
        <section className="relative overflow-hidden rounded-2xl border border-gold/25 bg-ink/40 p-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{ background: "radial-gradient(circle at 20% 10%, #F5D07A, transparent 60%)" }}
          />
          <div className="relative">
            <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              Career Profile
            </div>
            <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="font-display text-3xl text-foreground">{HEADER.name}</div>
                <div className="mt-1 text-sm italic text-gold/80">"{HEADER.tagline}"</div>
              </div>
              <div className="rounded-md border border-gold/30 bg-gold/5 px-3 py-1.5 text-[10px] uppercase tracking-widest text-gold">
                {HEADER.rank}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <HeaderField label="Profession"    value={HEADER.profession} />
              <HeaderField label="Class"         value={HEADER.className} />
              <HeaderField label="Rank"          value={HEADER.rank} accent />
              <HeaderField label="Business Unit" value={HEADER.businessUnit} />
            </div>
          </div>
        </section>

        {/* 2 · PERFORMANCE SYSTEM  +  3 · RANKING SYSTEM (side by side, distinct feel) */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Performance — "today" — warmer, active */}
          <section className="relative overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-br from-gold/[0.06] via-transparent to-transparent p-6 sm:p-7">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="font-display text-[11px] uppercase tracking-[0.3em] text-gold">
                  Performance System
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  This Month · {PERFORMANCE.month}
                </div>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Short-term
              </div>
            </div>

            <div className="mt-5 flex items-center gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-gold/50 bg-ink/60 shadow-[0_0_24px_rgba(245,208,122,0.25)]">
                <span className="font-display text-5xl text-gold">{PERFORMANCE.grade}</span>
              </div>
              <div className="flex-1">
                <div className="font-display text-lg text-foreground">{PERFORMANCE.gradeLabel}</div>
                <div className="mt-1 text-xs text-muted-foreground">Monthly Score</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-display text-3xl text-gold">{PERFORMANCE.score}</span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold/70 to-gold"
                    style={{ width: `${PERFORMANCE.score}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="mt-5 rounded-md border border-border/60 bg-ink/40 p-3 text-xs italic text-muted-foreground">
              {PERFORMANCE.summary}
            </p>

            <Link
              to="/performance"
              className="mt-5 inline-flex w-full items-center justify-center rounded-md border border-gold/40 bg-gold/10 px-4 py-2.5 text-[11px] uppercase tracking-widest text-gold transition hover:bg-gold/15"
            >
              View Monthly Performance →
            </Link>
          </section>

          {/* Ranking — "long game" — cooler, structural */}
          <section className="relative overflow-hidden rounded-xl border border-border bg-ink/40 p-6 sm:p-7">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="font-display text-[11px] uppercase tracking-[0.3em] text-foreground/70">
                  Ranking System
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Long-term Mastery
                </div>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Career
              </div>
            </div>

            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="rounded-lg border border-gold/40 bg-gold/[0.04] p-3 text-center">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Current</div>
                <div className="mt-1 font-display text-sm text-gold">{RANKING.current}</div>
              </div>
              <div className="text-muted-foreground/60">→</div>
              <div className="rounded-lg border border-dashed border-border/70 bg-ink/30 p-3 text-center">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Next</div>
                <div className="mt-1 font-display text-sm text-foreground/80">{RANKING.next}</div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>Journey Progress</span>
                <span className="text-gold">{RANKING.journeyPct}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold/50 to-gold"
                  style={{ width: `${RANKING.journeyPct}%` }}
                />
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>Promotion Requirements</span>
                <span className="text-gold">{gradeReqDone} / {gradeReqTotal}</span>
              </div>
              <ul className="space-y-1.5">
                {RANKING.requirements.map((r) => (
                  <li
                    key={r.label}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs ${
                      r.done ? "border-gold/25 bg-gold/[0.03]" : "border-border/70 bg-ink/30"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                        r.done ? "border-gold bg-gold/15 text-gold" : "border-border text-muted-foreground"
                      }`}>
                        {r.done ? "✓" : "○"}
                      </span>
                      <span className={r.done ? "text-gold" : "text-foreground"}>{r.label}</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {r.current} <span className="text-muted-foreground/50">/ {r.target}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* 4 · CAREER JOURNEY */}
        <section className="mt-6 rounded-xl border border-border bg-ink/30 p-6 sm:p-8">
          <div className="mb-6 flex items-baseline justify-between">
            <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">
              Career Journey
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Rank Timeline
            </div>
          </div>

          <ol className="relative space-y-4">
            <div className="absolute left-6 top-2 bottom-2 w-px bg-gradient-to-b from-gold/40 via-border to-border/40" />
            {JOURNEY.map((j, i) => {
              const isCurrent = i === currentIdx;
              const isPast = i < currentIdx;
              const isNext = i === currentIdx + 1;
              const isLocked = i > currentIdx;

              return (
                <li key={j.key} className="relative pl-16">
                  <div
                    className={`absolute left-0 flex h-12 w-12 items-center justify-center rounded-full border-2 text-xl ${
                      isCurrent
                        ? "border-gold bg-gold/10 shadow-[0_0_20px_rgba(245,208,122,0.4)]"
                        : isPast
                        ? "border-gold/40 bg-ink/60 opacity-70"
                        : isNext
                        ? "border-gold/40 bg-ink/40 border-dashed"
                        : "border-border/60 bg-ink/30 opacity-40"
                    }`}
                  >
                    {isLocked && !isNext ? <span className="text-muted-foreground/60">🔒</span> : <span>{j.glyph}</span>}
                  </div>

                  <div
                    className={`flex items-center justify-between rounded-lg border p-4 ${
                      isCurrent
                        ? "border-gold/50 bg-gold/5"
                        : isNext
                        ? "border-gold/25 bg-ink/40"
                        : "border-border bg-ink/30"
                    }`}
                  >
                    <div className={`font-display text-lg ${isCurrent ? "text-gold" : isLocked ? "text-muted-foreground/70" : "text-foreground"}`}>
                      {j.name}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest">
                      {isCurrent && <span className="rounded bg-gold/15 px-2 py-1 text-gold">● You are here</span>}
                      {isNext && <span className="rounded border border-gold/30 px-2 py-1 text-gold/80">Next</span>}
                      {isPast && <span className="text-muted-foreground/70">✓ Achieved</span>}
                      {isLocked && !isNext && <span className="text-muted-foreground/50">Locked</span>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* 5 · CAREER STATISTICS */}
        <section className="mt-6 rounded-xl border border-border bg-ink/30 p-6 sm:p-8">
          <div className="mb-6 flex items-baseline justify-between">
            <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">
              Career Statistics
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Lifetime
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Years Served"     value={STATS.yearsServed} />
            <StatCard label="Total Promotions" value={String(STATS.totalPromotions)} />
            <StatCard label="Current Legacy"   value={STATS.currentLegacy} />
            <StatCard label="Career Started"   value={STATS.careerStarted} />
          </div>
        </section>

        <div className="mt-8 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          Placeholder data · will bind to live records
        </div>
      </div>
    </div>
  );
}

function HeaderField({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border/60 bg-ink/40 p-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-sm ${accent ? "text-gold" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gold/20 bg-ink/40 p-4 text-center">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-xl text-gold">{value}</div>
    </div>
  );
}
