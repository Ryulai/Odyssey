import { createFileRoute } from "@tanstack/react-router";
import { useShowcase } from "@/lib/showcase/context";
import { GlowCard, SectionTitle } from "@/components/showcase/primitives";
import { OWNERSHIP_ORDER } from "@/lib/showcase/characters";
import { Check, Lock } from "lucide-react";

const DESC: Record<string, string> = {
  Explorer: "First steps. Learning what Odyssey is.",
  Guardian: "Protecting standards. Owning your area.",
  "Partner Candidate": "Trusted with cross-team decisions.",
  Partner: "A recognized co-builder of the guild.",
  "Business Partner": "Sharing in the ventures you help grow.",
  Shareholder: "A permanent stake in Odyssey's future.",
};

export const Route = createFileRoute("/showcase/ownership")({
  head: () => ({ meta: [{ title: "Ownership — Odyssey Showcase" }] }),
  component: OwnershipPage,
});

function OwnershipPage() {
  const { character: c } = useShowcase();
  const currentIdx = OWNERSHIP_ORDER.indexOf(c.ownership);

  return (
    <div className="max-w-6xl mx-auto">
      <SectionTitle
        eyebrow="What can I become?"
        title="Ownership Journey"
        subtitle="Ownership is earned through responsibility, not granted through position."
      />

      <div className="relative py-6">
        <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />
        <div className="relative grid grid-cols-2 md:grid-cols-6 gap-6">
          {OWNERSHIP_ORDER.map((stage, i) => {
            const walked = i < currentIdx;
            const current = i === currentIdx;
            const color = walked || current ? "#d4af37" : "#3a3540";
            return (
              <div key={stage} className="flex flex-col items-center text-center">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${current ? "scale-125" : ""}`}
                  style={{
                    background: walked || current ? `radial-gradient(circle at 30% 30%, ${color}66, ${color}20 60%, transparent 80%)` : "#0a080f",
                    border: `1px solid ${color}${walked || current ? "aa" : "60"}`,
                    boxShadow: current ? `0 0 30px ${color}90` : "none",
                  }}
                >
                  {walked ? <Check className="w-6 h-6" style={{ color }} /> :
                   current ? <span className="text-[#d4af37] font-display text-lg">{i + 1}</span> :
                   <Lock className="w-4 h-4 text-white/30" />}
                </div>
                <div className={`mt-4 font-display text-sm tracking-wide ${walked || current ? "text-parchment" : "text-white/40"}`}>{stage}</div>
                {current && <div className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] mt-1 animate-pulse">Current</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-10">
        {OWNERSHIP_ORDER.map((stage, i) => {
          const walked = i <= currentIdx;
          return (
            <GlowCard key={stage} glow={i === currentIdx} className={`p-6 ${walked ? "" : "opacity-50"}`}>
              <div className="flex items-center justify-between">
                <div className="font-display text-xl">{stage}</div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Stage {i + 1}</div>
              </div>
              <div className="text-white/60 text-sm mt-2">{DESC[stage]}</div>
            </GlowCard>
          );
        })}
      </div>
    </div>
  );
}
