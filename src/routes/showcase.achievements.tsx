import { createFileRoute } from "@tanstack/react-router";
import { useShowcase } from "@/lib/showcase/context";
import { GlowCard, SectionTitle, ProgressBar } from "@/components/showcase/primitives";
import { Lock } from "lucide-react";
import type { Achievement } from "@/lib/showcase/characters";

export const Route = createFileRoute("/showcase/achievements")({
  head: () => ({ meta: [{ title: "Achievements — Odyssey Showcase" }] }),
  component: Achievements,
});

function Achievements() {
  const { character: c } = useShowcase();
  const unlocked = c.achievements.filter((a) => a.unlockedOn);
  const locked = c.achievements.filter((a) => !a.unlockedOn);

  return (
    <div className="max-w-7xl mx-auto">
      <SectionTitle
        eyebrow="What have I achieved?"
        title="Achievements"
        subtitle={`${unlocked.length} of ${c.achievements.length} unlocked — every star belongs to you forever.`}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {c.achievements.map((a) => (
          <AchievementTile key={a.id} a={a} />
        ))}
      </div>

      {locked.length > 0 && (
        <div className="mt-16 text-center text-white/40 text-xs uppercase tracking-[0.4em]">
          {locked.length} mysterious {locked.length === 1 ? "star" : "stars"} still hidden
        </div>
      )}
    </div>
  );
}

function AchievementTile({ a }: { a: Achievement }) {
  const locked = !a.unlockedOn;
  return (
    <GlowCard glow={!locked && a.rare} className={`p-5 transition ${locked ? "opacity-50" : "hover:-translate-y-1"}`}>
      <div className="flex items-start gap-4">
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${locked ? "grayscale" : ""}`}
          style={{
            background: locked ? "#0a080f" : a.rare ? "linear-gradient(135deg,#3a2a10,#1a1408)" : "linear-gradient(135deg,#1a1620,#0d0a12)",
            border: locked ? "1px solid #2a2530" : "1px solid rgba(212,175,55,0.4)",
            boxShadow: !locked && a.rare ? "0 0 20px -4px rgba(212,175,55,0.5)" : "none",
          }}
        >
          {locked ? <Lock className="w-5 h-5 text-white/30" /> : a.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-display text-base truncate">{locked ? "???" : a.name}</div>
            {a.rare && !locked && (
              <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded text-[#d4af37] bg-[#d4af37]/10 border border-[#d4af37]/30">Rare</span>
            )}
          </div>
          <div className="text-white/50 text-xs mt-1 line-clamp-2">
            {locked ? "Continue your journey to reveal this achievement." : a.description}
          </div>
        </div>
      </div>

      {!locked && (
        <div className="mt-4">
          <div className="text-[11px] italic text-white/50 border-l-2 border-[#d4af37]/50 pl-3 leading-snug">
            "{a.quote}"
          </div>
          <div className="mt-3 flex justify-between text-[10px] uppercase tracking-widest text-white/40">
            <span>Unlocked</span><span className="text-[#d4af37]">{a.unlockedOn}</span>
          </div>
        </div>
      )}
      {locked && a.progress > 0 && (
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Progress · {a.progress}%</div>
          <ProgressBar value={a.progress} color="#6a6a6a" />
        </div>
      )}
    </GlowCard>
  );
}
