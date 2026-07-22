import { createFileRoute } from "@tanstack/react-router";
import { useShowcase } from "@/lib/showcase/context";
import { GlowCard, SectionTitle, rankColor, rankIndex } from "@/components/showcase/primitives";
import { JOURNEY_TREE, RANK_ORDER, type ShowcaseRank } from "@/lib/showcase/characters";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/showcase/journey-map")({
  head: () => ({ meta: [{ title: "Journey Map — Odyssey Showcase" }] }),
  component: JourneyMap,
});

function JourneyMap() {
  const { character: c } = useShowcase();
  const currentIdx = rankIndex(c.rank);
  const goldReached = currentIdx >= rankIndex("Gold" as ShowcaseRank);

  return (
    <div className="max-w-7xl mx-auto">
      <SectionTitle
        eyebrow="Where can I go next?"
        title="Journey Map"
        subtitle="Every rank you have walked. Every path that opens once you reach Gold."
      />

      <div className="grid md:grid-cols-[1fr_360px] gap-12 items-start">
        <div className="relative py-4">
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#d4af37]/40 to-transparent" />
          <div className="space-y-6">
            {RANK_ORDER.map((r, i) => {
              const isCurrent = r === c.rank;
              const walked = i <= currentIdx;
              return (
                <div key={r} className="relative flex justify-center">
                  <RankNode rank={r} state={isCurrent ? "current" : walked ? "walked" : "future"} />
                </div>
              );
            })}
          </div>

          {goldReached && (
            <div className="mt-12">
              <div className="text-center text-[10px] uppercase tracking-[0.4em] text-[#d4af37]/70 mb-6">
                After Gold, the path splits
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <BranchColumn
                  title="Secondary Class"
                  subtitle="New professions"
                  nodes={JOURNEY_TREE.secondaryClass}
                  unlocked={c.unlockedBranches}
                  layout="grid"
                />
                <BranchColumn
                  title="Mentorship"
                  subtitle="Grow others"
                  nodes={JOURNEY_TREE.mentorship}
                  unlocked={c.unlockedBranches}
                  layout="single"
                />
                <BranchColumn
                  title="Ownership"
                  subtitle="A path, not a choice"
                  nodes={JOURNEY_TREE.ownership}
                  unlocked={c.unlockedBranches}
                  layout="ladder"
                />
              </div>
            </div>
          )}
        </div>

        <GlowCard className="p-6 sticky top-24">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37]/70">Legend</div>
          <div className="mt-4 space-y-3 text-sm">
            <LegendRow color="#d4af37" label="Current rank — glowing" />
            <LegendRow color="#8a7a4a" label="Walked path" />
            <LegendRow color="#2a2530" label="Future rank" />
          </div>
          <div className="mt-6 border-t border-white/5 pt-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">After Gold</div>
            <div className="text-white/60 text-sm mt-2 leading-relaxed">
              The path splits into three: <span className="text-parchment">Secondary Class</span>, <span className="text-parchment">Mentorship</span>, and <span className="text-parchment">Ownership</span>. Each is its own journey.
            </div>
          </div>
          <div className="mt-6 border-t border-white/5 pt-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Unlocked for {c.name}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {c.unlockedBranches.length === 0 && <span className="text-white/40 text-xs">None yet — reach Gold first.</span>}
              {c.unlockedBranches.map((b: string) => (
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

type BranchLayout = "grid" | "single" | "ladder";

function BranchColumn({
  title,
  subtitle,
  nodes,
  unlocked,
  layout,
}: {
  title: string;
  subtitle: string;
  nodes: readonly string[];
  unlocked: string[];
  layout: BranchLayout;
}) {
  return (
    <GlowCard className="p-5">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37]/70">{title}</div>
      <div className="text-white/40 text-[11px] mt-0.5">{subtitle}</div>
      <div className="mt-4">
        {layout === "grid" && (
          <div className="grid grid-cols-2 gap-2">
            {nodes.map((n) => <Chip key={n} label={n} on={unlocked.includes(n)} />)}
          </div>
        )}
        {layout === "single" && (
          <div className="flex justify-center">
            <Chip label={nodes[0]} on={unlocked.includes(nodes[0])} big />
          </div>
        )}
        {layout === "ladder" && (
          <div className="relative flex flex-col items-stretch gap-2">
            <div className="absolute left-1/2 top-2 bottom-2 w-px -translate-x-1/2 bg-[#d4af37]/20" />
            {nodes.map((n) => (
              <div key={n} className="relative">
                <Chip label={n} on={unlocked.includes(n)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </GlowCard>
  );
}

function Chip({ label, on, big = false }: { label: string; on: boolean; big?: boolean }) {
  const color = "#d4af37";
  return (
    <div
      className={`uppercase tracking-widest rounded-lg border flex items-center gap-1.5 justify-center ${big ? "text-xs px-3 py-3 w-full" : "text-[10px] px-2 py-2"}`}
      style={{
        borderColor: on ? color + "80" : "#2a2530",
        background: on ? color + "12" : "#0a080f",
        color: on ? color : "#4a4655",
        boxShadow: on ? `0 0 20px -6px ${color}90` : "none",
      }}
    >
      {!on && <Lock className="w-2.5 h-2.5" />}
      {label}
    </div>
  );
}
