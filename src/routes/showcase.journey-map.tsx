import { createFileRoute } from "@tanstack/react-router";
import { useShowcase } from "@/lib/showcase/context";
import { GlowCard, SectionTitle, rankColor, rankIndex } from "@/components/showcase/primitives";
import { JOURNEY_BRANCHES, RANK_ORDER, type ShowcaseRank } from "@/lib/showcase/characters";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/showcase/journey-map")({
  head: () => ({ meta: [{ title: "Journey Map — Odyssey Showcase" }] }),
  component: JourneyMap,
});

function JourneyMap() {
  const { character: c } = useShowcase();
  const currentIdx = rankIndex(c.rank);

  return (
    <div className="max-w-7xl mx-auto">
      <SectionTitle
        eyebrow="Where can I go next?"
        title="Journey Map"
        subtitle="Every rank you have walked. Every path that opens once you reach Gold."
      />

      <div className="grid md:grid-cols-[1fr_360px] gap-12 items-start">
        {/* Spine */}
        <div className="relative py-4">
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#d4af37]/40 to-transparent" />
          <div className="space-y-6">
            {RANK_ORDER.map((r, i) => {
              const isCurrent = r === c.rank;
              const walked = i <= currentIdx;
              const color = rankColor(r);
              const isGold = r === "Gold";
              return (
                <div key={r} className="relative flex justify-center">
                  <RankNode rank={r} state={isCurrent ? "current" : walked ? "walked" : "future"} />
                  {isGold && (
                    <BranchFan
                      unlocked={c.unlockedBranches}
                      allUnlocked={currentIdx >= rankIndex("Gold" as ShowcaseRank)}
                      color={color}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <GlowCard className="p-6 sticky top-24">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37]/70">Legend</div>
          <div className="mt-4 space-y-3 text-sm">
            <LegendRow color="#d4af37" label="Current rank — glowing" />
            <LegendRow color="#8a7a4a" label="Walked path" />
            <LegendRow color="#2a2530" label="Future rank" />
          </div>
          <div className="mt-6 border-t border-white/5 pt-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Branches</div>
            <div className="text-white/60 text-sm mt-2 leading-relaxed">
              At Gold, the single path becomes many. Each branch is a new identity: Trainer, Leader, Content Creator, Business, Ownership.
            </div>
          </div>
          <div className="mt-6 border-t border-white/5 pt-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Unlocked for {c.name}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {c.unlockedBranches.length === 0 && <span className="text-white/40 text-xs">None yet — reach Gold first.</span>}
              {c.unlockedBranches.map((b) => (
                <span key={b} className="text-[10px] tracking-widest uppercase px-2 py-1 rounded-full bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30">{b}</span>
              ))}
            </div>
          </div>
        </GlowCard>
      </div>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
      <span className="text-white/70">{label}</span>
    </div>
  );
}

function RankNode({ rank, state }: { rank: ShowcaseRank; state: "current" | "walked" | "future" }) {
  const color = rankColor(rank);
  const isCurrent = state === "current";
  const walked = state !== "future";
  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`w-24 h-24 rounded-full flex items-center justify-center font-display text-sm tracking-widest uppercase transition-all ${isCurrent ? "scale-110" : ""}`}
        style={{
          background: walked ? `radial-gradient(circle at 30% 30%, ${color}55, ${color}15 60%, transparent 80%)` : "radial-gradient(circle, #14101a 0%, #0a080f 80%)",
          border: `1px solid ${walked ? color + "aa" : "#2a2530"}`,
          color: walked ? color : "#4a4655",
          boxShadow: isCurrent ? `0 0 40px ${color}80, inset 0 0 20px ${color}30` : walked ? `0 0 15px ${color}30` : "none",
        }}
      >
        {rank}
      </div>
      {isCurrent && (
        <div className="mt-2 text-[10px] uppercase tracking-[0.4em] animate-pulse" style={{ color }}>You are here</div>
      )}
    </div>
  );
}

function BranchFan({ unlocked, allUnlocked, color }: { unlocked: string[]; allUnlocked: boolean; color: string }) {
  if (!allUnlocked) return null;
  const items = JOURNEY_BRANCHES;
  return (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-8 hidden lg:block">
      <div className="grid grid-cols-3 gap-2 w-[320px]">
        {items.map((b) => {
          const on = unlocked.includes(b);
          return (
            <div
              key={b}
              className="text-[10px] uppercase tracking-widest px-2 py-2 rounded-lg border flex items-center gap-1.5 justify-center"
              style={{
                borderColor: on ? color + "80" : "#2a2530",
                background: on ? color + "12" : "#0a080f",
                color: on ? color : "#4a4655",
                boxShadow: on ? `0 0 20px -6px ${color}90` : "none",
              }}
            >
              {!on && <Lock className="w-2.5 h-2.5" />}
              {b}
            </div>
          );
        })}
      </div>
    </div>
  );
}
