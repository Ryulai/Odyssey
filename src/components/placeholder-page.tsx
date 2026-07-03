import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type Props = {
  eyebrow: string;              // e.g. "Collections"
  title: string;                // e.g. "Portraits"
  description: string;          // one-line purpose
  status?: "planned" | "coming-soon" | "locked";
  back?: { to: string; label: string };
  children?: ReactNode;         // optional custom content below the placeholder card
};

/**
 * Shared placeholder shell for Odyssey's scaffolded modules.
 * Renders a minimal, on-brand empty state — no business logic.
 * Future work only needs to replace `children` (or the whole component).
 */
export function PlaceholderPage({
  eyebrow,
  title,
  description,
  status = "planned",
  back = { to: "/map", label: "Odyssey Map" },
  children,
}: Props) {
  const statusMeta = {
    planned:       { label: "Planned",      tone: "text-muted-foreground border-border" },
    "coming-soon": { label: "Coming Soon",  tone: "text-gold border-gold/40" },
    locked:        { label: "Locked",       tone: "text-muted-foreground border-border/60" },
  }[status];

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between">
          <div className="font-display text-[10px] uppercase tracking-[0.4em] text-gold">
            {eyebrow}
          </div>
          <Link
            to={back.to}
            className="rounded-md border border-border px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
          >
            ← {back.label}
          </Link>
        </header>

        <section className="rounded-lg border border-border bg-ink/30 p-10 text-center sm:p-16">
          <div
            className={`mx-auto inline-block rounded-full border px-3 py-1 font-display text-[10px] uppercase tracking-[0.35em] ${statusMeta.tone}`}
          >
            {statusMeta.label}
          </div>
          <h1
            className="mt-6 font-display text-3xl tracking-[0.08em] text-foreground sm:text-4xl"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {title}
          </h1>
          <p
            className="mx-auto mt-4 max-w-xl text-base italic text-muted-foreground"
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            {description}
          </p>
          <div className="mx-auto mt-8 h-px w-16 bg-gold/40" />
          <p className="mt-6 text-[10px] uppercase tracking-[0.35em] text-muted-foreground/70">
            Framework in place · content arrives in a future voyage
          </p>
        </section>

        {children && <div className="mt-8">{children}</div>}
      </div>
    </div>
  );
}
