import { createFileRoute, Link } from "@tanstack/react-router";
import { MODULE_GROUPS, type ModuleEntry, type ModuleStatus, type ModuleGroup } from "@/lib/modules";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Odyssey Map — The Odyssey Guide" },
      { name: "description", content: "The main navigation of the Odyssey universe — Class, Profile, Guild, World, and System." },
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
              The five domains of the Odyssey universe.
            </p>
          </div>
          <Link to="/" className="rounded-md border border-border px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">← Home</Link>
        </header>

        <div className="space-y-12">
          {MODULE_GROUPS.map((g) => <Domain key={g.key} group={g} />)}
        </div>
      </div>
    </div>
  );
}

function Domain({ group }: { group: ModuleGroup }) {
  return (
    <section>
      <div className="mb-5 flex items-baseline justify-between border-b border-gold/20 pb-3">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl leading-none">{group.glyph}</span>
          <h2 className="font-display text-xl uppercase tracking-[0.3em] text-gold" style={{ fontFamily: "'Cinzel', serif" }}>
            {group.label}
          </h2>
          <span className="text-sm italic text-muted-foreground" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
            {group.subtitle}
          </span>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {group.entries.map((e) => <MapCard key={e.key} entry={e} />)}
      </div>
    </section>
  );
}

function MapCard({ entry }: { entry: ModuleEntry }) {
  const tone = statusTone(entry.status);
  return (
    <Link
      to={entry.to}
      className="group block rounded-md border border-border bg-ink/30 p-4 transition-colors hover:border-gold/40 hover:bg-ink/40"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-display text-sm tracking-[0.06em] text-foreground group-hover:text-gold">{entry.label}</div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 font-display text-[9px] uppercase tracking-widest ${tone}`}>
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
