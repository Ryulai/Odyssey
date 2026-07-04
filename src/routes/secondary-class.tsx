import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthGate } from "@/components/auth-gate";
import { usePrototype } from "@/lib/prototype/use-prototype";
import { prototypeRank, PROTOTYPE_RANKS } from "@/lib/prototype/ranks";
import type { PrototypeSecondary } from "@/lib/prototype/types";

export const Route = createFileRoute("/secondary-class")({
  head: () => ({
    meta: [
      { title: "Secondary Class — The Odyssey Guide" },
      { name: "description", content: "Your Secondary Class — an independent second Class with its own Monthly Performance, Ranking, and Promotion Journey." },
    ],
  }),
  component: () => <AuthGate><SecondaryClassPage /></AuthGate>,
});

const REAL_STATE = {
  unlocked: false,
  unlockRank: "Gold",
};

function SecondaryClassPage() {
  const { enabled, active } = usePrototype();
  const prototypeUnlocked = enabled && !!active;
  const secondaries: PrototypeSecondary[] = active?.secondaries ?? [];

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">
              Secondary Class
            </div>
            <div className="text-xs text-muted-foreground">
              System 3 · An independent second Class
            </div>
          </div>
          <Link
            to="/"
            className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
          >
            ← Ledger
          </Link>
        </header>

        {/* Explainer */}
        <section className="rounded-2xl border border-gold/25 bg-ink/40 p-8">
          <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            About This System
          </div>
          <p className="mt-3 text-sm text-foreground/90">
            Your Secondary Class is an <span className="text-gold">independent second Class</span>.
            It has its own <span className="text-gold">Monthly Performance</span>, its own{" "}
            <span className="text-gold">Ranking</span>, its own <span className="text-gold">Promotion Journey</span>,
            and its own records. It follows exactly the same systems as your main Class while remaining completely independent.
          </p>
          <p className="mt-3 text-xs italic text-muted-foreground">
            Prototype accounts may equip any number of Secondary Classes for demonstration.
          </p>
        </section>

        {/* Prototype: show secondaries */}
        {prototypeUnlocked ? (
          <section className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-display text-sm uppercase tracking-widest text-amber-200">
                ⚡ Prototype · Active Secondary Classes
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {secondaries.length} equipped
              </div>
            </div>
            {secondaries.length === 0 ? (
              <div className="rounded-xl border border-border bg-ink/30 p-8 text-center text-xs text-muted-foreground">
                No Secondary Classes on this demo profile. Add some in the Prototype panel.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {secondaries.map((sec) => (
                  <SecondaryCard key={sec.id} sec={sec} />
                ))}
              </div>
            )}
          </section>
        ) : !REAL_STATE.unlocked ? (
          <section className="mt-6 rounded-xl border border-border bg-ink/30 p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-gold/40 bg-ink/60 text-2xl">
              🔒
            </div>
            <div className="mt-5 font-display text-xl text-gold">Locked</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Your Secondary Class unlocks at{" "}
              <span className="text-gold">{REAL_STATE.unlockRank}</span> Rank in your Class.
            </p>
            <p className="mt-1 text-[11px] italic text-muted-foreground">
              Every great adventurer first masters one Class before walking another path.
            </p>

            <div className="mx-auto mt-6 max-w-md rounded-lg border border-border/60 bg-ink/40 p-4 text-left">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                What unlocks
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-foreground/90">
                <li>◇ Choose a second Class and role</li>
                <li>◇ Independent Monthly Performance (System 1)</li>
                <li>◇ Independent Rank progression (System 2)</li>
                <li>◇ Separate Promotion Journey &amp; records</li>
              </ul>
            </div>

            <Link
              to="/career"
              className="mt-6 inline-flex items-center justify-center rounded-md border border-gold/40 bg-gold/10 px-4 py-2.5 text-[11px] uppercase tracking-widest text-gold transition hover:bg-gold/15"
            >
              Advance Your Class →
            </Link>
          </section>
        ) : (
          <section className="mt-6 rounded-xl border border-gold/30 bg-ink/40 p-8">
            <div className="font-display text-sm uppercase tracking-widest text-gold">
              Secondary Class Active
            </div>
          </section>
        )}

        <div className="mt-8 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          System 3 · Architecture reserved · UI expands after unlock
        </div>
      </div>
    </div>
  );
}

function SecondaryCard({ sec }: { sec: PrototypeSecondary }) {
  const rank = prototypeRank(sec.rankKey) ?? PROTOTYPE_RANKS[0];
  return (
    <div
      className="rounded-xl border bg-ink/40 p-5"
      style={{ borderColor: `${rank.color}55` }}
    >
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-display text-lg text-foreground">{sec.className}</div>
          {sec.role && (
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{sec.role}</div>
          )}
        </div>
        <div
          className="font-display text-xs uppercase tracking-widest"
          style={{ color: rank.color, textShadow: `0 0 10px ${rank.color}66` }}
        >
          {rank.glyph} {rank.label}
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>Progress</span>
          <span>{sec.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded bg-ink/60">
          <div
            className="h-full rounded"
            style={{ width: `${sec.progress}%`, background: rank.color }}
          />
        </div>
      </div>
      <div className="mt-3 text-[10px] italic text-muted-foreground">
        Independent Rank · Independent Performance · Independent Records
      </div>
    </div>
  );
}
