import { createFileRoute, Link } from "@tanstack/react-router";
import { useShowcase } from "@/lib/showcase/context";
import { GlowCard, RankBadge, ProgressBar, rankColor } from "@/components/showcase/primitives";
import { Compass, Target, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/showcase/")({
  head: () => ({ meta: [{ title: "Home — Odyssey Showcase" }] }),
  component: Home,
});

function Home() {
  const { character: c } = useShowcase();
  const color = rankColor(c.rank);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero */}
      <section className="relative grid md:grid-cols-[420px_1fr] gap-10 items-center py-8">
        {/* Portrait */}
        <div className="relative mx-auto">
          <div
            className="w-[340px] h-[420px] rounded-[2rem] relative overflow-hidden"
            style={{
              background: c.portraitGradient,
              boxShadow: `0 40px 100px -20px ${color}55, inset 0 0 80px rgba(0,0,0,0.5)`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-[220px] leading-none text-white/20 select-none">{c.portraitInitial}</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <RankBadge rank={c.rank} size="sm" />
            </div>
          </div>
          <div
            className="absolute -inset-4 rounded-[2.5rem] -z-10 blur-3xl opacity-40"
            style={{ background: color }}
          />
        </div>

        {/* Identity */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.5em] text-[#d4af37]/70">{c.season}</div>
          <h1 className="font-display text-6xl md:text-7xl tracking-wide mt-3">{c.name}</h1>
          <div className="text-2xl mt-2" style={{ color }}>{c.title}</div>
          <div className="text-white/50 mt-1">{c.tenure}</div>
          <p className="mt-6 text-white/70 max-w-lg text-lg font-light leading-relaxed">{c.bio}</p>

          <div className="mt-8 flex flex-wrap gap-2">
            {c.titles.map((t) => (
              <span key={t} className="text-xs tracking-widest uppercase px-3 py-1 rounded-full border border-[#d4af37]/25 text-[#d4af37]/90">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats grid */}
      <section className="grid md:grid-cols-3 gap-4 mt-12">
        <GlowCard className="p-6">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40"><Compass className="w-3.5 h-3.5" /> Current Mission</div>
          <div className="font-display text-xl mt-3 leading-snug">{c.currentMission}</div>
        </GlowCard>
        <GlowCard glow className="p-6">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[#d4af37]/70"><Sparkles className="w-3.5 h-3.5" /> Performance</div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="font-display text-6xl" style={{ color }}>{c.performance.overall}</span>
            <span className="text-white/40 text-sm">/ 100</span>
          </div>
          <div className="mt-4"><ProgressBar value={c.performance.overall} color={color} /></div>
        </GlowCard>
        <GlowCard className="p-6">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40"><Target className="w-3.5 h-3.5" /> Current Goal</div>
          <div className="font-display text-xl mt-3 leading-snug">{c.currentGoal}</div>
        </GlowCard>
      </section>

      {/* Quick nav */}
      <section className="grid md:grid-cols-3 gap-4 mt-10">
        {[
          { to: "/showcase/journey-map", label: "Explore the Journey Map", desc: "Every path from here forward." },
          { to: "/showcase/achievements", label: "See your Achievements", desc: "Every star earned." },
          { to: "/showcase/timeline", label: "Read your Story", desc: "Every step, one by one." },
        ].map((l) => (
          <Link key={l.to} to={l.to} className="group">
            <GlowCard className="p-6 h-full transition hover:-translate-y-1 hover:ring-1 hover:ring-[#d4af37]/40">
              <div className="text-parchment font-display text-lg">{l.label}</div>
              <div className="text-white/50 text-sm mt-1">{l.desc}</div>
              <div className="mt-4 text-[#d4af37] text-xs uppercase tracking-[0.3em] flex items-center gap-1">
                Enter <ArrowRight className="w-3 h-3 transition group-hover:translate-x-1" />
              </div>
            </GlowCard>
          </Link>
        ))}
      </section>
    </div>
  );
}
