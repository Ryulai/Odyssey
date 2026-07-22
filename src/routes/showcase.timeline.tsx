import { createFileRoute } from "@tanstack/react-router";
import { useShowcase } from "@/lib/showcase/context";
import { GlowCard, SectionTitle } from "@/components/showcase/primitives";

export const Route = createFileRoute("/showcase/timeline")({
  head: () => ({ meta: [{ title: "Journey Timeline — Odyssey Showcase" }] }),
  component: TimelinePage,
});

const KIND_COLOR: Record<string, string> = {
  join: "#7fd8ff",
  rank: "#d4af37",
  achievement: "#c58bff",
  mission: "#ffbe6b",
  unlock: "#8affc1",
  future: "#6a6a80",
};

function TimelinePage() {
  const { character: c } = useShowcase();

  return (
    <div className="max-w-3xl mx-auto">
      <SectionTitle eyebrow="Every step, one by one." title="Journey Timeline" subtitle={`The story of ${c.name}, told in milestones.`} />

      <div className="relative pl-10">
        <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-[#d4af37]/40 via-white/10 to-transparent" />
        <div className="space-y-4">
          {c.timeline.map((e, i) => {
            const color = KIND_COLOR[e.kind] ?? "#d4af37";
            const future = e.kind === "future";
            return (
              <div key={i} className="relative">
                <div
                  className="absolute -left-[26px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-sm"
                  style={{
                    background: future ? "#0a080f" : `radial-gradient(circle, ${color}88, ${color}20 60%, transparent)`,
                    border: `1px solid ${color}${future ? "60" : "aa"}`,
                    boxShadow: future ? "none" : `0 0 12px ${color}80`,
                  }}
                >
                  <span className="text-[10px]">{e.icon}</span>
                </div>
                <GlowCard glow={!future && e.kind === "rank"} className={`p-4 pl-6 ${future ? "opacity-60 border-dashed" : ""}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color }}>{e.kind}</div>
                      <div className="font-display text-lg mt-1">{e.title}</div>
                    </div>
                    <div className="text-white/50 text-xs uppercase tracking-widest">{e.date}</div>
                  </div>
                </GlowCard>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
