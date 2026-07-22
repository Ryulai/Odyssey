import { Link, useRouterState } from "@tanstack/react-router";
import { ACTS, findAct } from "@/lib/showcase/acts";

export function ActProgress() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const current = findAct(path);
  const currentN = current?.n ?? 0;

  return (
    <div className="flex items-center gap-1.5">
      {ACTS.map((a) => {
        const done = a.n < currentN;
        const active = a.n === currentN;
        return (
          <Link
            key={a.n}
            to={a.to as "/showcase"}
            title={`Act ${a.n} — ${a.label}`}
            className="group relative py-2"
          >
            <span
              className={`block rounded-full transition-all ${
                active
                  ? "w-6 h-1.5 bg-[#d4af37] shadow-[0_0_10px_#d4af37]"
                  : done
                    ? "w-1.5 h-1.5 bg-[#d4af37]/60"
                    : "w-1.5 h-1.5 bg-white/15 group-hover:bg-white/40"
              }`}
            />
          </Link>
        );
      })}
    </div>
  );
}
