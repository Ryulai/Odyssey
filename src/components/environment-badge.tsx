import { useEffect, useState } from "react";
import {
  environmentLabel,
  resolveEnvironment,
  type OdysseyEnvironment,
} from "@/lib/environment";

/** Resolves the current release channel on the client (hostname based). */
export function useOdysseyEnvironment(): OdysseyEnvironment {
  const [env, setEnv] = useState<OdysseyEnvironment>("prototype");
  useEffect(() => {
    setEnv(resolveEnvironment(window.location.hostname));
  }, []);
  return env;
}

/**
 * Always-visible release channel indicator so nobody has to inspect the URL to
 * know whether they are looking at Prototype or the frozen Beta release.
 */
export function EnvironmentBadge() {
  const env = useOdysseyEnvironment();
  const isBeta = env === "beta";
  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-[60]">
      <span
        className={`rounded-full border px-3 py-1 text-[9px] font-display uppercase tracking-[0.3em] backdrop-blur ${
          isBeta
            ? "border-gold/60 bg-gold/10 text-gold"
            : "border-amber-400/50 bg-amber-500/10 text-amber-200"
        }`}
      >
        {environmentLabel(env)}
      </span>
    </div>
  );
}
