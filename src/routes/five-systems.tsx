import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/five-systems")({
  head: () => ({
    meta: [
      { title: "Five Systems — The Odyssey Guide" },
      { name: "description", content: "The five core progression systems of Odyssey — your path from Class to Ownership." },
      { property: "og:title", content: "Five Systems — The Odyssey Guide" },
      { property: "og:description", content: "The five core progression systems of Odyssey — your path from Class to Ownership." },
    ],
  }),
  component: FiveSystemsPage,
});

type SystemCard = {
  number: string;
  title: string;
  description: string;
  status: "coming-soon" | "locked";
  to: string;
};

const SYSTEMS: SystemCard[] = [
  {
    number: "01",
    title: "Class System",
    description:
      "Track your primary class, role, performance (ABCD), and class progression.",
    status: "coming-soon",
    to: "/career",
  },
  {
    number: "02",
    title: "Ranking System",
    description:
      "View your current rank, promotion requirements, and long-term progression from Bronze to Legend.",
    status: "coming-soon",
    to: "/promotions",
  },
  {
    number: "03",
    title: "Second Class System",
    description:
      "Unlock after reaching Gold Rank. Track your secondary class independently from your primary class.",
    status: "locked",
    to: "/secondary-class",
  },
  {
    number: "04",
    title: "Mentorship System",
    description:
      "Develop future Shipbuilders by mentoring and guiding apprentices.",
    status: "coming-soon",
    to: "/mentorship",
  },
  {
    number: "05",
    title: "Ownership System",
    description:
      "Your long-term journey toward becoming a partner, shareholder, or founder.",
    status: "coming-soon",
    to: "/ownership",
  },
];

function FiveSystemsPage() {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10 flex items-center justify-between">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.4em] text-gold">
              Progression
            </div>
            <h1
              className="mt-2 font-display text-3xl tracking-[0.08em] text-foreground sm:text-4xl"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Five Systems
            </h1>
            <p
              className="mt-2 max-w-md text-sm italic text-muted-foreground"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              Every journey begins with a single class. Choose your path through
              the five pillars of Odyssey.
            </p>
          </div>
          <Link
            to="/map"
            className="rounded-md border border-border px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
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

function SystemCard({ system }: { system: SystemCard }) {
  const isLocked = system.status === "locked";

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
          {isLocked ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-muted-foreground/30 bg-ink/60 px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Lock size={12} strokeWidth={2} />
              Locked
            </span>
          ) : (
            <span className="rounded-full border border-gold/30 bg-gold/5 px-2.5 py-1 font-display text-[10px] uppercase tracking-widest text-gold">
              Coming Soon
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {system.description}
        </p>
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
