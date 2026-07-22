import { createFileRoute } from "@tanstack/react-router";
import { useShowcase } from "@/lib/showcase/context";
import { GlowCard, SectionTitle, ProgressBar, RankBadge } from "@/components/showcase/primitives";

export const Route = createFileRoute("/showcase/mentorship")({
  head: () => ({ meta: [{ title: "Mentorship — Odyssey Showcase" }] }),
  component: MentorshipPage,
});

function MentorshipPage() {
  const { character: c } = useShowcase();
  const m = c.mentorship;

  return (
    <div className="max-w-6xl mx-auto">
      <SectionTitle eyebrow="Who have I helped?" title="Mentorship" subtitle="Great leaders multiply. This is your influence, measured in others." />

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Mentorship Score" value={m.score} color="#d4af37" />
        <StatCard label="People Helped" value={m.peopleHelped} suffix="" color="#7fd8ff" />
        <StatCard label="Growth Influence" value={m.influence} color="#c58bff" />
      </div>

      <div className="mb-4 text-[10px] uppercase tracking-[0.3em] text-white/40">Current Mentees</div>
      {m.mentees.length === 0 ? (
        <GlowCard className="p-8 text-center text-white/50">
          Your first mentee is waiting. Reach Gold Rank to open the Mentorship path.
        </GlowCard>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {m.mentees.map((mn) => (
            <GlowCard key={mn.name} className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-display text-xl"
                  style={{ background: "linear-gradient(135deg,#2a2038,#12101a)", border: "1px solid rgba(212,175,55,0.3)" }}
                >
                  {mn.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-display text-lg">{mn.name}</div>
                    <RankBadge rank={mn.rank} size="sm" />
                  </div>
                  <div className="text-white/50 text-xs mt-1">Since {mn.since}</div>
                  <div className="text-white/70 text-sm mt-3">{mn.note}</div>
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40 mb-1">
                      <span>Growth</span><span className="text-[#d4af37]">{mn.growth}%</span>
                    </div>
                    <ProgressBar value={mn.growth} />
                  </div>
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, suffix = "" }: { label: string; value: number; color: string; suffix?: string }) {
  return (
    <GlowCard className="p-6">
      <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">{label}</div>
      <div className="font-display text-5xl mt-3" style={{ color }}>{value}{suffix}</div>
    </GlowCard>
  );
}
