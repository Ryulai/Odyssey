import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home, Map, User, Trophy, Gauge, Crown, Sparkles, Compass, Landmark, Clock,
} from "lucide-react";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/showcase", label: "Home", icon: Home, exact: true },
  { to: "/showcase/journey-map", label: "Journey Map", icon: Map },
  { to: "/showcase/profile", label: "Hunter Profile", icon: User },
  { to: "/showcase/achievements", label: "Achievements", icon: Trophy },
  { to: "/showcase/performance", label: "Performance", icon: Gauge },
  { to: "/showcase/rank", label: "Class Rank", icon: Crown },
  { to: "/showcase/secondary-class", label: "Secondary Class", icon: Sparkles },
  { to: "/showcase/mentorship", label: "Mentorship", icon: Compass },
  { to: "/showcase/ownership", label: "Ownership", icon: Landmark },
  { to: "/showcase/timeline", label: "Journey Timeline", icon: Clock },
];

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
      <nav className="flex-1 px-3 py-6 space-y-1">
        {NAV.map((item) => {
          const active = item.exact ? path === item.to : path.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to as string as "/showcase"}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                active
                  ? "bg-gradient-to-r from-[#d4af37]/20 to-transparent text-parchment shadow-[inset_0_0_0_1px_rgba(212,175,55,0.3)]"
                  : "text-white/50 hover:text-parchment hover:bg-white/5"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-[#d4af37]" : ""}`} />
              <span className="text-sm font-medium tracking-wide">{item.label}</span>
              {active && <span className="ml-auto w-1 h-4 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37]" />}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 border-t border-white/5">
        <Link to="/" className="text-[10px] uppercase tracking-[0.3em] text-white/30 hover:text-white/60 transition">
          ← Exit Showcase
        </Link>
      </div>
    </aside>
  );
}
