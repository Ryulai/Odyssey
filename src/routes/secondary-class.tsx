import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthGate } from "@/components/auth-gate";

export const Route = createFileRoute("/secondary-class")({
  head: () => ({
    meta: [
      { title: "Secondary Class — The Odyssey Guide" },
      { name: "description", content: "Your second profession — its own performance, ranking, and promotion history, tracked independently from your Class." },
    ],
  }),
  component: () => <AuthGate><SecondaryClassPage /></AuthGate>,
});

// ─── Placeholder data (System 3) ───────────────────────────────────
const SECONDARY = {
  unlocked: false,
  unlockRank: "Gold Hunter",
  chosenClass: null as string | null,
  chosenRole: null as string | null,
};

function SecondaryClassPage() {
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
              System 3 · A complete second profession
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
            Your Secondary Class is an <span className="text-gold">independent second profession</span>.
            It has its own <span className="text-gold">Performance</span>, its own{" "}
            <span className="text-gold">Ranking</span>, its own promotion history, and its own progression —
            calculated the same way as your Class, but tracked separately.
          </p>
          <p className="mt-3 text-xs italic text-muted-foreground">
            Example: Class · Vanguard  |  Secondary Class · Battle Mage. Both have their own rank,
            grade, promotions, and records. Future voyages will support multiple secondaries.
          </p>
        </section>

        {/* Locked / Unlocked state */}
        {!SECONDARY.unlocked ? (
          <section className="mt-6 rounded-xl border border-border bg-ink/30 p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-gold/40 bg-ink/60 text-2xl">
              🔒
            </div>
            <div className="mt-5 font-display text-xl text-gold">Locked</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Your Secondary Class unlocks at{" "}
              <span className="text-gold">{SECONDARY.unlockRank}</span> in your Class.
            </p>
            <p className="mt-1 text-[11px] italic text-muted-foreground">
              Master your first profession before beginning your second journey.
            </p>

            <div className="mx-auto mt-6 max-w-md rounded-lg border border-border/60 bg-ink/40 p-4 text-left">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                What unlocks
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-foreground/90">
                <li>◇ Choose a second class and role</li>
                <li>◇ Independent Monthly Performance (System 1)</li>
                <li>◇ Independent Rank progression (System 2)</li>
                <li>◇ Separate promotion history & records</li>
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
            <p className="mt-2 text-xs text-muted-foreground">
              Placeholder — Performance & Ranking panels for this slot will appear here once
              independent records begin accruing.
            </p>
          </section>
        )}

        <div className="mt-8 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          System 3 · Architecture reserved · UI expands after unlock
        </div>
      </div>
    </div>
  );
}
