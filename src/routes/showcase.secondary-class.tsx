import { createFileRoute } from "@tanstack/react-router";
import { useShowcase } from "@/lib/showcase/context";
import { GlowCard, SectionTitle, ProgressBar } from "@/components/showcase/primitives";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/showcase/secondary-class")({
  head: () => ({ meta: [{ title: "Secondary Class — Odyssey Showcase" }] }),
  component: SecondaryPage,
});

function SecondaryPage() {
  const { character: c } = useShowcase();
  const anyUnlocked = c.secondaryTrees.some((t) => t.unlocked);

  return (
    <div className="max-w-6xl mx-auto">
      <SectionTitle
        eyebrow="What else can I become?"
        title="Secondary Class"
        subtitle="At Gold, growth becomes a tree. Every branch is a new identity you can master alongside your Main Class."
      />

      {!anyUnlocked && (
        <GlowCard className="p-6 mb-6 flex items-center gap-4">
          <Lock className="w-5 h-5 text-white/50" />
          <div>
            <div className="font-display text-lg">Secondary Class is sealed until Gold Rank</div>
            <div className="text-white/50 text-sm">Trust before opportunity — Odyssey's oldest rule.</div>
          </div>
        </GlowCard>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {c.secondaryTrees.map((t) => {
          const locked = !t.unlocked;
          return (
            <GlowCard
              key={t.key}
              glow={t.level >= 3}
              className={`p-6 transition ${locked ? "opacity-40" : "hover:-translate-y-1"}`}
            >
              <div className="flex items-start justify-between">
                <div className="text-4xl">{locked ? <Lock className="w-8 h-8 text-white/30" /> : t.icon}</div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Level</div>
                  <div className="font-display text-3xl text-[#d4af37]">{t.level}</div>
                </div>
              </div>
              <div className="font-display text-xl mt-4">{t.name}</div>
              <div className="text-white/50 text-sm mt-1">{t.description}</div>

              {!locked && (
                <>
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40 mb-1">
                      <span>Progress</span><span className="text-[#d4af37]">{t.progress}%</span>
                    </div>
                    <ProgressBar value={t.progress} />
                  </div>
                  <div className="mt-4 text-xs text-white/60 border-t border-white/5 pt-3">
                    <span className="text-white/40 uppercase tracking-widest text-[10px]">Next · </span>
                    {t.nextUnlock}
                  </div>
                </>
              )}
            </GlowCard>
          );
        })}
      </div>
    </div>
  );
}
