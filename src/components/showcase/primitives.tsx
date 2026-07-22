import type { ReactNode, CSSProperties } from "react";
import { RANK_ORDER, type ShowcaseRank } from "@/lib/showcase/characters";

export const RANK_COLOR: Record<ShowcaseRank, string> = {
  Apprentice: "#8a8a8a",
  Bronze: "#b87333",
  Silver: "#c0c0c0",
  Gold: "#d4af37",
  Platinum: "#dbe7f2",
  Diamond: "#7fd8ff",
  Master: "#c58bff",
  Legend: "#ff5d5d",
};

export function rankColor(r: ShowcaseRank) {
  return RANK_COLOR[r];
}

export function GlowCard({
  children,
  className = "",
  glow = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className={
        "relative rounded-2xl border border-[#3a2f1a]/60 bg-gradient-to-b from-[#161016]/95 to-[#0b0810]/95 backdrop-blur-sm " +
        "shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] " +
        (glow ? "ring-1 ring-[#d4af37]/40 shadow-[0_0_40px_-8px_rgba(212,175,55,0.35)] " : "") +
        className
      }
      style={style}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <div className="text-[10px] uppercase tracking-[0.4em] text-[#d4af37]/70 font-medium">{eyebrow}</div>
      )}
      <h1 className="font-display text-4xl md:text-5xl text-parchment mt-2 tracking-wide">{title}</h1>
      {subtitle && <p className="text-white/60 mt-3 max-w-2xl">{subtitle}</p>}
    </div>
  );
}

export function ProgressBar({ value, color = "#d4af37" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: `linear-gradient(90deg, ${color}, ${color}dd)`,
          boxShadow: `0 0 12px ${color}80`,
        }}
      />
    </div>
  );
}

export function RankBadge({ rank, size = "md" }: { rank: ShowcaseRank; size?: "sm" | "md" | "lg" }) {
  const c = rankColor(rank);
  const sz = size === "lg" ? "text-base px-4 py-1.5" : size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-display tracking-[0.2em] uppercase ${sz}`}
      style={{
        color: c,
        background: `${c}18`,
        border: `1px solid ${c}55`,
        boxShadow: `0 0 20px -6px ${c}80`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
      {rank}
    </span>
  );
}

export function rankIndex(r: ShowcaseRank) {
  return RANK_ORDER.indexOf(r);
}
