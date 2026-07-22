import { createFileRoute } from "@tanstack/react-router";
import { useShowcase } from "@/lib/showcase/context";
import { GlowCard, SectionTitle, RankBadge, rankColor, ProgressBar } from "@/components/showcase/primitives";

export const Route = createFileRoute("/showcase/profile")({
  head: () => ({ meta: [{ title: "Hunter Profile — Odyssey Showcase" }] }),
  component: Profile,
});

function Profile() {
  const { character: c } = useShowcase();
  const color = rankColor(c.rank);

  return (
    <div className="max-w-6xl mx-auto">
      <SectionTitle eyebrow="Who am I?" title="Hunter Profile" />

      <div className="grid md:grid-cols-[280px_1fr] gap-8">
        <GlowCard className="p-6 text-center">
          <div
            className="w-40 h-40 rounded-full mx-auto flex items-center justify-center font-display text-6xl text-white/80"
            style={{ background: c.portraitGradient, boxShadow: `0 0 40px ${color}60` }}
          >
            {c.portraitInitial}
          </div>
          <div className="mt-6 font-display text-2xl">{c.name}</div>
          <div className="mt-2"><RankBadge rank={c.rank} /></div>
          <div className="text-white/50 text-sm mt-2">{c.tenure}</div>
        </GlowCard>

        <div className="space-y-4">
          <GlowCard className="p-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Bio</div>
            <p className="mt-3 text-white/80 leading-relaxed">{c.bio}</p>
          </GlowCard>

          <div className="grid md:grid-cols-2 gap-4">
            <GlowCard className="p-6">
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Current Season</div>
              <div className="font-display text-lg mt-2">{c.season}</div>
            </GlowCard>
            <GlowCard className="p-6">
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Current Focus</div>
              <div className="font-display text-lg mt-2">{c.performance.focus}</div>
            </GlowCard>
          </div>

          <GlowCard className="p-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-4">Titles Earned</div>
            <div className="flex flex-wrap gap-2">
              {c.titles.map((t) => (
                <span key={t} className="px-3 py-1.5 rounded-full text-xs tracking-widest uppercase border border-[#d4af37]/25 text-[#d4af37]">{t}</span>
              ))}
            </div>
          </GlowCard>

          <GlowCard className="p-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-4">Performance Snapshot</div>
            <div className="space-y-3">
              {[
                ["Overall", c.performance.overall],
                ["Behaviour", c.performance.behaviour],
                ["Direction", c.performance.direction],
                ["Contribution", c.performance.contribution],
                ["Result", c.performance.result],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>{label}</span><span style={{ color }}>{val}</span>
                  </div>
                  <ProgressBar value={val as number} color={color} />
                </div>
              ))}
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
