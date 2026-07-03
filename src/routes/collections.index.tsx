import { createFileRoute, Link } from "@tanstack/react-router";
import { MODULE_GROUPS } from "@/lib/modules";

export const Route = createFileRoute("/collections/")({
  head: () => ({ meta: [{ title: "Collections — The Odyssey Guide" }] }),
  component: CollectionsHub,
});

function CollectionsHub() {
  const group = MODULE_GROUPS.find((g) => g.key === "collections")!;
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.4em] text-gold">Collections</div>
            <h1 className="mt-2 font-display text-3xl tracking-[0.08em]" style={{ fontFamily: "'Cinzel', serif" }}>The Vault</h1>
          </div>
          <Link to="/map" className="rounded-md border border-border px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">← Odyssey Map</Link>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {group.entries.map((e) => (
            <Link key={e.key} to={e.to} className="group rounded-md border border-border bg-ink/30 p-4 hover:border-gold/40">
              <div className="font-display text-sm tracking-[0.06em] text-foreground group-hover:text-gold">{e.label}</div>
              <p className="mt-1 text-xs text-muted-foreground">{e.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
