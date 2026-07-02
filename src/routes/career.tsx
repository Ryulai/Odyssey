import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthGate } from "@/components/auth-gate";

export const Route = createFileRoute("/career")({
  head: () => ({
    meta: [
      { title: "Main Career — The Odyssey Guide" },
      { name: "description", content: "Your long-term career journey: identity, promotion timeline, and the requirements before your next rank." },
    ],
  }),
  component: () => <AuthGate><CareerPage /></AuthGate>,
});

// ─── Placeholder data ──────────────────────────────────────────────
const IDENTITY = {
  name: "Ryu Lai",
  profession: "Sales Ambassador",
  className: "Ranger",
  role: "Hunter",
  rank: "Bronze Hunter",
  businessUnit: "Sales",
  fleet: "Ting Livehouse",
  manager: "Elder Ryu",
  joinDate: "2024-08-01",
  careerStage: "Early Voyage",
  tagline: "I Can Do It.",
};

const JOURNEY: { key: string; name: string; glyph: string; note: string }[] = [
  { key: "apprentice",   name: "Apprentice",     glyph: "⚓", note: "First voyage" },
  { key: "bronze",       name: "Bronze Hunter",  glyph: "🥉", note: "Proven crew" },
  { key: "silver",       name: "Silver Hunter",  glyph: "🥈", note: "Trusted hand" },
  { key: "gold",         name: "Gold Hunter",    glyph: "🥇", note: "Fleet asset" },
  { key: "black",        name: "Black Hunter",   glyph: "🖤", note: "Master hunter" },
  { key: "diamond",      name: "Diamond Hunter", glyph: "💎", note: "Legendary" },
  { key: "director",     name: "Director",       glyph: "👑", note: "Beyond rank" },
];

const CURRENT_KEY = "bronze";
const NEXT_KEY = "silver";

const REQUIREMENTS: { label: string; current: string; target: string; done: boolean; hint?: string }[] = [
  { label: "Tenure at current rank",     current: "4 months",     target: "6 months",     done: false, hint: "2 months remaining" },
  { label: "Monthly Reviews completed",  current: "3 / 6",        target: "6 reviews",    done: false, hint: "3 more voyage reviews" },
  { label: "Grade B or higher",          current: "3 months",     target: "3 months",     done: true },
  { label: "Grade A achieved",           current: "1 month",      target: "1 month",      done: true },
  { label: "Achievements approved",      current: "8 / 12",       target: "12 records",   done: false, hint: "4 more Harbor Records" },
  { label: "Guild Standing",             current: "Clear",        target: "No violations", done: true },
  { label: "Captain endorsement",        current: "Pending",      target: "1 endorsement", done: false, hint: "Requested from Elder Ryu" },
];

const completed = REQUIREMENTS.filter(r => r.done).length;
const total = REQUIREMENTS.length;
const currentIdx = JOURNEY.findIndex(j => j.key === CURRENT_KEY);
const nextRank = JOURNEY.find(j => j.key === NEXT_KEY);

function CareerPage() {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">
              Main Career
            </div>
            <div className="text-xs text-muted-foreground">
              Where am I in my professional journey?
            </div>
          </div>
          <Link
            to="/"
            className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
          >
            ← Ledger
          </Link>
        </header>

        {/* SECTION 1 — Career Identity */}
        <section className="relative overflow-hidden rounded-2xl border border-gold/25 bg-ink/40 p-8">
          <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{
            background: "radial-gradient(circle at 20% 10%, #F5D07A, transparent 60%)",
          }} />
          <div className="relative">
            <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              Character Sheet
            </div>
            <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="font-display text-3xl text-foreground">{IDENTITY.name}</div>
                <div className="mt-1 text-sm italic text-gold/80">"{IDENTITY.tagline}"</div>
              </div>
              <div className="rounded-md border border-gold/30 bg-gold/5 px-3 py-1.5 text-[10px] uppercase tracking-widest text-gold">
                Stage · {IDENTITY.careerStage}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <IdentityField label="Profession" value={IDENTITY.profession} />
              <IdentityField label="Class" value={`${IDENTITY.className} · ${IDENTITY.role}`} />
              <IdentityField label="Rank"    value={IDENTITY.rank} accent />
              <IdentityField label="Business Unit" value={IDENTITY.businessUnit} />
              <IdentityField label="Fleet"   value={IDENTITY.fleet} />
              <IdentityField label="Manager" value={IDENTITY.manager} />
              <IdentityField label="Join Date" value={new Date(IDENTITY.joinDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} />
              <IdentityField label="Voyage Length" value={monthsSince(IDENTITY.joinDate)} />
            </div>
          </div>
        </section>

        {/* SECTION 2 — Career Journey */}
        <section className="mt-6 rounded-xl border border-border bg-ink/30 p-6 sm:p-8">
          <div className="mb-6 flex items-baseline justify-between">
            <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">
              Career Journey
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Promotion Timeline
            </div>
          </div>

          <ol className="relative space-y-4">
            {/* Vertical rail */}
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
                    <div>
                      <div className={`font-display text-lg ${isCurrent ? "text-gold" : isLocked ? "text-muted-foreground/70" : "text-foreground"}`}>
                        {j.name}
                      </div>
                      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                        {j.note}
                      </div>
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

        {/* SECTION 3 — Promotion Requirements */}
        <section className="mt-6 rounded-xl border border-border bg-ink/30 p-6 sm:p-8">
          <div className="mb-4 flex items-baseline justify-between">
            <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">
              Promotion Requirements
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Journey to {nextRank?.name}
            </div>
          </div>

          {/* Progress banner */}
          <div className="rounded-lg border border-gold/30 bg-gradient-to-r from-gold/5 via-transparent to-gold/5 p-5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>{IDENTITY.rank}</span>
              <span className="text-gold">
                {completed} / {total} Requirements
              </span>
              <span>{nextRank?.name}</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold/70 to-gold"
                style={{ width: `${(completed / total) * 100}%` }}
              />
            </div>
          </div>

          {/* Requirements list */}
          <ul className="mt-6 space-y-3">
            {REQUIREMENTS.map((r) => (
              <li
                key={r.label}
                className={`rounded-lg border p-4 ${
                  r.done ? "border-gold/25 bg-gold/[0.03]" : "border-border bg-ink/40"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                        r.done ? "border-gold bg-gold/15 text-gold" : "border-border text-muted-foreground"
                      }`}
                    >
                      {r.done ? "✓" : "○"}
                    </div>
                    <div>
                      <div className={`font-display text-sm uppercase tracking-widest ${r.done ? "text-gold" : "text-foreground"}`}>
                        {r.label}
                      </div>
                      {r.hint && !r.done && (
                        <div className="mt-1 text-[11px] italic text-muted-foreground">
                          {r.hint}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className={r.done ? "text-gold" : "text-foreground"}>{r.current}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      of {r.target}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-md border border-border/60 bg-ink/40 px-4 py-3 text-center text-[11px] uppercase tracking-widest text-muted-foreground">
            All requirements must be met before Captain review for promotion to{" "}
            <span className="text-gold">{nextRank?.name}</span>
          </div>
        </section>

        <div className="mt-8 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          Placeholder data · will bind to live progression records
        </div>
      </div>
    </div>
  );
}

function IdentityField({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border/60 bg-ink/40 p-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 font-display text-sm ${accent ? "text-gold" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

function monthsSince(iso: string) {
  const start = new Date(iso);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${months} month${months === 1 ? "" : "s"}`;
  if (rem === 0) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years}y ${rem}m`;
}
