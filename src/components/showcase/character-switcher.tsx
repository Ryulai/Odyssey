import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useShowcase } from "@/lib/showcase/context";
import { rankColor } from "./primitives";

export function CharacterSwitcher() {
  const { all, character, setCharacterId } = useShowcase();
  const [open, setOpen] = useState(false);
  const c = rankColor(character.rank);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 rounded-full border border-[#d4af37]/30 bg-black/60 backdrop-blur px-3 py-2 pr-4 hover:border-[#d4af37]/60 transition-all shadow-[0_0_20px_-8px_rgba(212,175,55,0.5)]"
      >
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center font-display text-sm text-white"
          style={{ background: character.portraitGradient, boxShadow: `0 0 12px ${c}80` }}
        >
          {character.portraitInitial}
        </span>
        <span className="text-left leading-tight">
          <span className="block text-parchment text-sm font-display tracking-wide">{character.name}</span>
          <span className="block text-[10px] uppercase tracking-[0.2em]" style={{ color: c }}>
            {character.title}
          </span>
        </span>
        <ChevronDown className="w-4 h-4 text-white/50" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#d4af37]/30 bg-[#0b0810]/98 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 border-b border-white/5">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37]/70">Showcase Character</div>
              <div className="text-xs text-white/50 mt-0.5">Instantly reshape every page</div>
            </div>
            <div className="py-1">
              {all.map((ch) => {
                const active = ch.id === character.id;
                const rc = rankColor(ch.rank);
                return (
                  <button
                    key={ch.id}
                    onClick={() => { setCharacterId(ch.id); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition ${active ? "bg-white/[0.03]" : ""}`}
                  >
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center font-display text-white"
                      style={{ background: ch.portraitGradient, boxShadow: `0 0 14px ${rc}70` }}
                    >
                      {ch.portraitInitial}
                    </span>
                    <span className="flex-1 text-left">
                      <span className="block text-parchment text-sm font-display">{ch.name}</span>
                      <span className="block text-[11px]" style={{ color: rc }}>{ch.title}</span>
                      <span className="block text-[10px] text-white/40">{ch.tenure}</span>
                    </span>
                    {active && <Check className="w-4 h-4 text-[#d4af37]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
