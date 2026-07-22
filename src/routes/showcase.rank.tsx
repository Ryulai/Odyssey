import { createFileRoute } from "@tanstack/react-router";
import { useShowcase } from "@/lib/showcase/context";
import { GlowCard, SectionTitle, rankColor, rankIndex } from "@/components/showcase/primitives";
import { RANK_ORDER } from "@/lib/showcase/characters";
import { Check, Lock, Sparkles } from "lucide-react";

const RANK_PHILOSOPHY: Record<string, string> = {
  Apprentice: "Learning. Building basic habits.",
  Bronze: "\"I can do it.\" Independent responsibility.",
  Silver: "\"You can trust me.\" Consistent and dependable.",
  Gold: "\"I can influence.\" Secondary Class unlocks here.",
  Platinum: "Professional excellence.",
  Diamond: "Exceptional consistency. Organizational value.",
  Master: "Recognized expert. Shapes standards.",
  Legend: "Legacy, not status. The highest recognition.",
};

const GOLD_UNLOCKS = ["Secondary Class unlocked", "Mentorship unlocked", "Advanced Missions unlocked"];

export const Route = createFileRoute("/showcase/rank")({
  head: () => ({ meta: [{ title: "Class Rank — Odyssey Showcase" }] }),
  component: RankPage,
});

function RankPage() {
  const { character: c } = useShowcase();
  const currentIdx = rankIndex(c.rank);

  return (
    <div className="max-w-4xl mx-auto">
      <SectionTitle eyebrow="How far have I walked?" title="Class Rank" subtitle="Ranking is permanent. Performance is today. This is your journey." />

      <div className="space-y-3">
        {RANK_ORDER.map((r, i) => {
          const walked = i < currentIdx;
          const current = i === currentIdx;
          const color = rankColor(r);
          return (
            <GlowCard
              key={r}
              glow={current}
              className={`p-6 flex items-center gap-6 transition ${current ? "scale-[1.02]" : walked ? "opacity-90" : "opacity-45"}`}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: walked || current ? `radial-gradient(circle at 30% 30%, ${color}66, ${color}22 55%, transparent 80%)` : "#0a080f",
                  border: `1px solid ${walked || current ? color + "aa" : "#2a2530"}`,
                  boxShadow: current ? `0 0 30px ${color}80` : "none",
                }}
              >
                {walked ? <Check className="w-6 h-6" style={{ color }} /> :
                 current ? <Sparkles className="w-6 h-6" style={{ color }} /> :
                 <Lock className="w-5 h-5 text-white/30" />}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="font-display text-2xl tracking-wide" style={{ color: walked || current ? color : "#5a5560" }}>{r}</div>
                  {current && <span className="text-[10px] uppercase tracking-[0.4em]" style={{ color }}>You are here</span>}
                </div>
                <div className="text-white/60 text-sm mt-1">{RANK_PHILOSOPHY[r]}</div>
                {r === "Gold" && (walked || current) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {GOLD_UNLOCKS.map((u) => (
                      <span key={u} className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border border-[#d4af37]/40 text-[#d4af37]/90 bg-[#d4af37]/5">{u}</span>
                    ))}
                  </div>
                )}
              </div>
            </GlowCard>
          );
        })}
      </div>
    </div>
  );
}
