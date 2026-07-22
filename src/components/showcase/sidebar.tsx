import { Link, useRouterState } from "@tanstack/react-router";
import { ACTS } from "@/lib/showcase/acts";

const GROUPS: Array<typeof ACTS[number]["group"]> = ["Prologue", "The Hunter", "The Path", "The Story"];

export function ShowcaseSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-[#d4af37]/10 bg-[#08060c]/90 backdrop-blur-xl min-h-screen sticky top-0">
      <div className="px-6 py-8 border-b border-white/5">
        <Link to="/showcase" className="block">
          <div className="text-[10px] uppercase tracking-[0.4em] text-[#d4af37]/70">Odyssey</div>
          <div className="font-display text-2xl text-parchment tracking-wider mt-1">Showcase</div>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
        {GROUPS.map((group) => (
          <div key={group}>
            <div className="px-3 mb-2 text-[9px] uppercase tracking-[0.4em] text-[#d4af37]/50">{group}</div>
            <div className="space-y-0.5">
              {ACTS.filter((a) => a.group === group).map((item) => {
                const active = item.to === "/showcase" ? path === item.to : path.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to as "/showcase"}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      active
                        ? "bg-gradient-to-r from-[#d4af37]/20 to-transparent text-parchment shadow-[inset_0_0_0_1px_rgba(212,175,55,0.3)]"
                        : "text-white/45 hover:text-parchment hover:bg-white/5"
                    }`}
                  >
                    <span className={`text-[10px] font-display w-5 text-center ${active ? "text-[#d4af37]" : "text-white/30"}`}>
                      {String(item.n).padStart(2, "0")}
                    </span>
                    <span className="text-sm tracking-wide">{item.label}</span>
                    {active && <span className="ml-auto w-1 h-4 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37]" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-white/5">
        <Link to="/" className="text-[10px] uppercase tracking-[0.3em] text-white/30 hover:text-white/60 transition">
          ← Exit Showcase
        </Link>
      </div>
    </aside>
  );
}
