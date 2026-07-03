import { createFileRoute, Link } from "@tanstack/react-router";
import { MODULE_GROUPS, type ModuleEntry, type ModuleStatus } from "@/lib/modules";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Odyssey Map — The Odyssey Guide" },
      { name: "description", content: "The complete Odyssey navigation map: Career, Profile, Collections, and System modules." },
    ],
  }),
  component: OdysseyMap,
});

function OdysseyMap() {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.4em] text-gold">Odyssey Map</div>
            <h1 className="mt-2 font-display text-3xl tracking-[0.08em] text-foreground sm:text-4xl" style={{ fontFamily: "'Cinzel', serif" }}>
              Chart Your Course
            </h1>
            <p className="mt-2 max-w-xl text-sm italic text-muted-foreground" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              Every module Odyssey holds — live today, or planned for a future voyage.
            </p>
          </div>
          <Link to="/" className="rounded-md border border-border px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">← Home</Link>
        </header>

        <div className="space-y-10">
          {MODULE_GROUPS.map((g) => (
            <section key={g.key}>
              <div className="mb-4 flex items-baseline justify-between border-b border-border/60 pb-2">
                <h2 className="font-display text-lg uppercase tracking-[0.3em] text-gold">{g.label}</h2>
                <span className="text-[11px] italic text-muted-foreground" style={{ fontFamily: '"Cormorant Garamond", serif' }}>{g.blurb}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.entries.map((e) => <MapCard key={e.key} entry={e} />)}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function MapCard({ entry }: { entry: ModuleEntry }) {
  const tone = statusTone(entry.status);
  return (
    <Link
      to={entry.to}
      className="group block rounded-md border border-border bg-ink/30 p-4 transition-colors hover:border-gold/40 hover:bg-ink/40"
    >
      <div className="flex items-center justify-between">
        <div className="font-display text-sm tracking-[0.06em] text-foreground group-hover:text-gold">{entry.label}</div>
        <span className={`rounded-full border px-2 py-0.5 font-display text-[9px] uppercase tracking-widest ${tone}`}>
          {statusLabel(entry.status)}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{entry.description}</p>
    </Link>
  );
}

function statusLabel(s: ModuleStatus) {
  return s === "live" ? "Live" : s === "planned" ? "Planned" : s === "coming-soon" ? "Coming Soon" : "Locked";
}
function statusTone(s: ModuleStatus) {
  if (s === "live") return "text-emerald-300 border-emerald-400/50";
  if (s === "coming-soon") return "text-gold border-gold/40";
  if (s === "locked") return "text-muted-foreground border-border/60";
  return "text-muted-foreground border-border";
}
