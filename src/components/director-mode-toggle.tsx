import { useDirectorMode } from "@/lib/director-mode";

/**
 * Fixed top-right toggle for Director Mode.
 *
 * Renders NOTHING for Crew and Captain. Only Directors (and future Founders)
 * see this control. See mem://features/permission-system-v1.
 */
export function DirectorModeToggle() {
  const { eligible, enabled, toggle } = useDirectorMode();
  if (!eligible) return null;

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-[60] flex flex-col items-end gap-2 sm:right-4 sm:top-4">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={enabled}
        aria-label={enabled ? "Turn Director Mode off" : "Turn Director Mode on"}
        className={[
          "pointer-events-auto inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-display text-[10px] uppercase tracking-[0.25em] shadow-sm transition-colors",
          enabled
            ? "border-red-400/70 bg-red-500/20 text-red-100 hover:bg-red-500/30"
            : "border-border/70 bg-ink/70 text-muted-foreground hover:border-gold/50 hover:text-gold",
        ].join(" ")}
      >
        <span
          aria-hidden
          className={[
            "inline-block h-2 w-2 rounded-full",
            enabled ? "bg-red-300 shadow-[0_0_8px_currentColor]" : "bg-muted-foreground/60",
          ].join(" ")}
        />
        Director Mode {enabled ? "ON" : "OFF"}
      </button>
    </div>
  );
}

/**
 * Full-width banner shown at the top of the page while Director Mode is ON.
 * Kept intentionally loud so administrators always know they are working
 * with override tools.
 */
export function DirectorModeBanner() {
  const { enabled } = useDirectorMode();
  if (!enabled) return null;
  return (
    <div className="sticky top-0 z-50 border-b border-red-400/60 bg-red-500/15 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-1.5 text-center">
        <span aria-hidden className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-300" />
        <span className="font-display text-[10px] uppercase tracking-[0.35em] text-red-100">
          Director Mode — Override tools active. Every change is audited.
        </span>
      </div>
    </div>
  );
}
