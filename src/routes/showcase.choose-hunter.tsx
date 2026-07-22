import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useShowcase } from "@/lib/showcase/context";
import { rankColor, RankBadge } from "@/components/showcase/primitives";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/showcase/choose-hunter")({
  head: () => ({ meta: [{ title: "Choose Hunter — Odyssey Showcase" }] }),
  component: ChooseHunter,
});

function ChooseHunter() {
  const { all, characterId, setCharacterId } = useShowcase();
  const navigate = useNavigate();

  const pick = (id: string) => {
    setCharacterId(id);
    navigate({ to: "/showcase/journey-map" });
  };

  return (
    <div className="min-h-screen px-6 py-16 md:py-24 flex flex-col items-center">
      <div className="text-center max-w-2xl mb-14">
        <div className="text-[10px] uppercase tracking-[0.5em] text-[#d4af37]/70 mb-4">Act 2</div>
        <h1 className="font-display text-5xl md:text-6xl tracking-wide text-parchment">
          Whose journey shall we <span className="text-[#d4af37]">walk</span>?
        </h1>
        <p className="mt-6 text-white/60 text-lg font-light">
          Five hunters, five stories. Choose one to step into their world.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 w-full max-w-6xl">
        {all.map((c) => {
          const color = rankColor(c.rank);
          const active = c.id === characterId;
          return (
            <button
              key={c.id}
              onClick={() => pick(c.id)}
              className={`group relative rounded-2xl overflow-hidden border transition-all text-left ${
                active
                  ? "border-[#d4af37] shadow-[0_0_60px_-10px_rgba(212,175,55,0.8)] -translate-y-1"
                  : "border-white/10 hover:border-[#d4af37]/60 hover:-translate-y-1"
              }`}
            >
              <div
                className="aspect-[3/4] relative flex items-end p-5"
                style={{
                  background: c.portraitGradient,
                  boxShadow: `inset 0 0 100px rgba(0,0,0,0.6)`,
                }}
              >
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[140px] leading-none text-white/15 select-none">
                  {c.portraitInitial}
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="relative z-10 w-full">
                  <div className="mb-2"><RankBadge rank={c.rank} size="sm" /></div>
                  <div className="font-display text-2xl text-parchment">{c.name}</div>
                  <div className="text-xs mt-0.5" style={{ color }}>{c.title}</div>
                  <div className="text-[10px] text-white/50 mt-1">{c.tenure}</div>
                </div>
              </div>
              <div className={`px-4 py-3 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] transition ${
                active ? "bg-[#d4af37]/10 text-[#d4af37]" : "bg-black/40 text-white/40 group-hover:text-[#d4af37]"
              }`}>
                <span>{active ? "Selected" : "Walk their path"}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          );
        })}
      </div>

      <Link
        to="/showcase"
        className="mt-14 text-[10px] uppercase tracking-[0.4em] text-white/40 hover:text-white/80 transition"
      >
        ← Back to Welcome
      </Link>
    </div>
  );
}
