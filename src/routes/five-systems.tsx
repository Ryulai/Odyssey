import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/five-systems")({
  head: () => ({
    meta: [
      { title: "Five Core Systems — The Odyssey Guide" },
      { name: "description", content: "The five core systems of Odyssey — Performance, Ranking, Secondary Class, Mentorship, and Ownership." },
      { property: "og:title", content: "Five Core Systems — The Odyssey Guide" },
      { property: "og:description", content: "The five core systems of Odyssey — Performance, Ranking, Secondary Class, Mentorship, and Ownership." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FiveSystemsPage,
});

type SystemCard = {
  number: string;
  title: string;
  description: string;
  status: "live" | "coming-soon" | "locked";
  to: string;
  /** Existing Odyssey features that already belong to this Core System. */
  existing: string[];
};

const SYSTEMS: SystemCard[] = [
  {
    number: "01",
    title: "Performance System",
    description:
      "Measures current contribution during an evaluation period. Class Performance + Guild Performance, resolved into an ABCD grade.",
    status: "live",
    to: "/performance",
    existing: ["Monthly Performance", "Performance Review", "ABCD grading", "Peer Insights"],
  },
  {
    number: "02",
    title: "Ranking System",
    description:
      "Accumulated long-term growth — Apprentice through Legend. Performance is an input into Ranking, never equal to it.",
    status: "live",
    to: "/promotions",
    existing: ["Promotion Progress", "Rank per Identity", "Promotion history"],
  },
  {
    number: "03",
    title: "Secondary Class System",
    description:
      "A complete second profession unlocked after Gold Rank, with its own performance, ranking, and growth history.",
    status: "locked",
    to: "/secondary-class",
    existing: ["Secondary Class page", "Identity array (Main + Sub Classes)"],
  },
  {
    number: "04",
    title: "Mentorship System",
    description:
      "Guiding others — mentors, apprentices, mentorship history and recognition. Reserved architecture.",
    status: "coming-soon",
    to: "/mentorship",
    existing: [],
  },
  {
    number: "05",
    title: "Ownership System",
    description:
      "The long-term path toward partnership, shares, and business responsibility. Reserved architecture.",
    status: "coming-soon",
    to: "/ownership",
    existing: [],
  },
];

function FiveSystemsPage() {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10 flex items-start justify-between gap-4">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.4em] text-gold">
              Core Architecture
            </div>
            <h1
              className="mt-2 font-display text-3xl tracking-[0.08em] text-foreground sm:text-4xl"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Five Core Systems
            </h1>
            <p
              className="mt-2 max-w-md text-sm italic text-muted-foreground"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              Growth is not a single path. Multiple paths can happen at the same
              time.
            </p>
          </div>
          <Link
            to="/map"
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
          >
            ← Odyssey Map
          </Link>
        </header>

        {/* Cards */}
        <div className="space-y-4">
          {SYSTEMS.map((system) => (
            <SystemCard key={system.number} system={system} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: SystemCard["status"] }) {
  if (status === "locked") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-muted-foreground/30 bg-ink/60 px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        <Lock size={12} strokeWidth={2} />
        Locked
      </span>
    );
  }
  if (status === "live") {
    return (
      <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 font-display text-[10px] uppercase tracking-widest text-gold">
        Active
      </span>
    );
  }
  return (
    <span className="rounded-full border border-gold/30 bg-gold/5 px-2.5 py-1 font-display text-[10px] uppercase tracking-widest text-gold">
      Coming Soon
    </span>
  );
}

function SystemCard({ system }: { system: SystemCard }) {
  return (
    <Link
      to={system.to}
      className="group relative flex items-start gap-5 rounded-xl border border-border bg-ink/30 p-5 transition hover:border-gold/40 hover:bg-ink/50 sm:p-6"
    >
      {/* Number */}
      <div className="mt-0.5 font-display text-2xl tracking-widest text-gold/40 group-hover:text-gold/70 sm:text-3xl">
        {system.number}
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg tracking-[0.06em] text-foreground group-hover:text-gold sm:text-xl">
            {system.title}
          </h2>
          <StatusPill status={system.status} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {system.description}
        </p>
        {system.existing.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
              In app today
            </span>
            {system.existing.map((f) => (
              <span
                key={f}
                className="rounded border border-border/70 bg-ink/40 px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {f}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Arrow */}
      <div className="mt-1 text-muted-foreground/50 group-hover:text-gold">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </Link>
  );
}
