import { createFileRoute } from "@tanstack/react-router";
import { useShowcase } from "@/lib/showcase/context";
import { GlowCard, SectionTitle, ProgressBar, rankColor } from "@/components/showcase/primitives";

export const Route = createFileRoute("/showcase/performance")({
  head: () => ({ meta: [{ title: "Performance — Odyssey Showcase" }] }),
  component: PerformancePage,
});

function PerformancePage() {
  const { character: c } = useShowcase();
  const color = rankColor(c.rank);
  const p = c.performance;
  const stats = [
    { k: "Behaviour", v: p.behaviour, note: "How you show up." },
    { k: "Direction", v: p.direction, note: "How aligned you are." },
    { k: "Contribution", v: p.contribution, note: "What you add to the guild." },
    { k: "Result", v: p.result, note: "What you delivered." },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <SectionTitle eyebrow="Where am I now?" title="Performance" subtitle="Not a scorecard. A living portrait of contribution." />

      <div className="grid md:grid-cols-[1fr_1.2fr] gap-6">
        {/* Overall orb */}
        <GlowCard glow className="p-10 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="text-[10px] uppercase tracking-[0.5em] text-[#d4af37]/70">Overall Performance</div>
          <div
            className="mt-6 w-56 h-56 rounded-full flex items-center justify-center relative"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${color}66, ${color}22 40%, #08060c 75%)`,
              boxShadow: `0 0 80px ${color}55, inset 0 0 40px rgba(0,0,0,0.6)`,
            }}
          >
            <div className="text-center">
              <div className="font-display text-7xl" style={{ color }}>{p.overall}</div>
              <div className="text-white/50 text-xs uppercase tracking-widest mt-1">Score</div>
            </div>
          </div>
          <div className="mt-6 text-white/60 text-sm text-center max-w-xs">{p.focus}</div>
        </GlowCard>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <GlowCard key={s.k} className="p-5">
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">{s.k}</div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-display text-4xl" style={{ color }}>{s.v}</span>
                  <span className="text-white/40 text-xs">/100</span>
                </div>
                <div className="mt-3"><ProgressBar value={s.v} color={color} /></div>
                <div className="text-white/40 text-xs mt-3">{s.note}</div>
              </GlowCard>
            ))}
          </div>

          <GlowCard className="p-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Growth Trend · 6 months</div>
            <TrendChart data={p.trend} color={color} />
          </GlowCard>
        </div>
      </div>
    </div>
  );
}

function TrendChart({ data, color }: { data: number[]; color: string }) {
  const w = 500, h = 140, pad = 12;
  const max = 100, min = 0;
  const step = (w - pad * 2) / (data.length - 1);
  const points = data.map((v, i) => {
    const x = pad + i * step;
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    return [x, y] as const;
  });
  const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const dFill = `${d} L${points[points.length - 1][0]},${h - pad} L${points[0][0]},${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full mt-4">
      <defs>
        <linearGradient id="tg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={dFill} fill="url(#tg)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 5 : 3} fill={color} style={i === points.length - 1 ? { filter: `drop-shadow(0 0 8px ${color})` } : {}} />
      ))}
    </svg>
  );
}
