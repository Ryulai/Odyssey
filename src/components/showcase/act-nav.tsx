import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ACTS, findAct, neighbors } from "@/lib/showcase/acts";

export function ActNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const current = findAct(path);
  if (!current) return null;
  const { prev, next } = neighbors(current);

  return (
    <nav className="mt-20 border-t border-[#d4af37]/10 pt-8 flex items-center justify-between gap-4">
      {prev ? (
        <Link
          to={prev.to as "/showcase"}
          className="group flex items-center gap-3 text-left flex-1 min-w-0"
        >
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 group-hover:border-[#d4af37]/50 group-hover:text-[#d4af37] transition">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Act {prev.n}</div>
            <div className="text-sm font-display text-parchment truncate">{prev.label}</div>
          </div>
        </Link>
      ) : <div className="flex-1" />}

      <div className="text-[10px] uppercase tracking-[0.4em] text-[#d4af37]/70 shrink-0 text-center">
        Act {current.n} of {ACTS.length}
      </div>

      {next ? (
        <Link
          to={next.to as "/showcase"}
          className="group flex items-center gap-3 justify-end text-right flex-1 min-w-0"
        >
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Act {next.n}</div>
            <div className="text-sm font-display text-parchment truncate">{next.label}</div>
          </div>
          <div className="w-10 h-10 rounded-full border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] group-hover:bg-[#d4af37]/10 group-hover:shadow-[0_0_20px_-4px_#d4af37] transition">
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      ) : <div className="flex-1" />}
    </nav>
  );
}
