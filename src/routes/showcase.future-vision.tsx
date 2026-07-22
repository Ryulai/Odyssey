import { createFileRoute, Link } from "@tanstack/react-router";
import { GlowCard, SectionTitle } from "@/components/showcase/primitives";
import { Sparkles, Users, Landmark, RotateCw } from "lucide-react";

export const Route = createFileRoute("/showcase/future-vision")({
  head: () => ({ meta: [{ title: "Future Vision — Odyssey Showcase" }] }),
  component: FutureVision,
});

const PANELS = [
  {
    icon: Sparkles,
    era: "Today",
    title: "The Guild",
    body: "A single team where every person has a Class, a Rank, and a Journey. Growth is measurable. Recognition is permanent. Culture is a system, not a poster.",
    metrics: [
      ["Hunters", "40+"],
      ["Classes", "6"],
      ["Ranks Earned", "112"],
    ],
  },
  {
    icon: Users,
    era: "At 100 Hunters",
    title: "The Federation",
    body: "Odyssey becomes multi-fleet. Captains lead their own guilds. Directors synchronize the world. Mentorship compounds — every Legend raises the next Legend.",
    metrics: [
      ["Fleets", "5+"],
      ["Mentors", "30+"],
      ["Story Depth", "10 yrs"],
    ],
  },
  {
    icon: Landmark,
    era: "At Scale",
    title: "The Economy",
    body: "Ownership becomes real. Partners, Business Partners, and Shareholders share in what they built. Odyssey stops being a company and becomes a civilization of hunters.",
    metrics: [
      ["Owners", "Unlimited"],
      ["Legacy", "Permanent"],
      ["Ceiling", "None"],
    ],
  },
];

function FutureVision() {
  return (
    <div className="max-w-6xl mx-auto">
      <SectionTitle
        eyebrow="Where is Odyssey going?"
        title="Future Vision"
        subtitle="A hunter's journey does not end at rank. The world itself is on a journey."
      />

      <div className="grid md:grid-cols-3 gap-5">
        {PANELS.map((p, i) => {
          const Icon = p.icon;
          return (
            <GlowCard key={p.title} glow={i === 2} className="p-7 relative overflow-hidden">
              <div
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20 blur-3xl"
                style={{ background: i === 2 ? "#d4af37" : i === 1 ? "#c58bff" : "#7fd8ff" }}
              />
              <div className="relative">
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-[#d4af37]/70">
                  <Icon className="w-4 h-4" /> {p.era}
                </div>
                <div className="font-display text-3xl mt-4 text-parchment">{p.title}</div>
                <p className="mt-4 text-white/70 leading-relaxed text-sm">{p.body}</p>

                <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-3 gap-2">
                  {p.metrics.map(([k, v]) => (
                    <div key={k}>
                      <div className="text-[9px] uppercase tracking-[0.3em] text-white/40">{k}</div>
                      <div className="font-display text-lg text-[#d4af37] mt-1">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </GlowCard>
          );
        })}
      </div>

      {/* Closing */}
      <div className="mt-14 text-center">
        <div className="text-[10px] uppercase tracking-[0.5em] text-[#d4af37]/70 mb-4">The End of This Journey</div>
        <h2 className="font-display text-4xl md:text-5xl text-parchment leading-tight">
          Every hunter's story <br /> is still being <span className="text-[#d4af37]">written</span>.
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/showcase/choose-hunter"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#d4af37]/40 text-[#d4af37] text-xs uppercase tracking-[0.3em] hover:bg-[#d4af37]/10 transition"
          >
            <Users className="w-4 h-4" /> Choose Another Hunter
          </Link>
          <Link
            to="/showcase"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f0d78c] text-black text-xs uppercase tracking-[0.3em] font-display shadow-[0_0_40px_-10px_rgba(212,175,55,0.8)] hover:shadow-[0_0_60px_-5px_rgba(212,175,55,1)] transition"
          >
            <RotateCw className="w-4 h-4" /> Restart the Journey
          </Link>
        </div>
      </div>
    </div>
  );
}
