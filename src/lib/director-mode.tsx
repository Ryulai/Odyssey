import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/roles";

/**
 * Director Mode — administrative override state.
 *
 * FROZEN RULES (see mem://features/permission-system-v1):
 *  - Default state is OFF. When OFF the app behaves exactly like production.
 *  - Only users with the `director` role (or future `founder` role) may
 *    enable it. Crew and Captain must never see the toggle.
 *  - When ON, override UIs across the app become visible. Every override
 *    action must require a confirmation and write an Audit Log entry.
 *  - The badge must be visually obvious so administrators always know they
 *    are making override changes.
 *
 * State is intentionally session-scoped (sessionStorage, per tab). It does
 * NOT persist across browser sessions — the default is always OFF on new
 * sign-ins to prevent accidental overrides.
 */

const STORAGE_KEY = "odyssey.director-mode.v1";

type DirectorModeCtx = {
  eligible: boolean;   // may this user toggle Director Mode?
  enabled: boolean;    // is Director Mode currently ON?
  setEnabled: (v: boolean) => void;
  toggle: () => void;
};

const Ctx = createContext<DirectorModeCtx>({
  eligible: false,
  enabled: false,
  setEnabled: () => {},
  toggle: () => {},
});

export function DirectorModeProvider({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  // TODO: extend when a `founder` role is added to the app_role enum.
  const eligible = role === "director";

  const [enabled, setEnabledState] = useState(false);

  // Restore from sessionStorage on mount (per-tab), but only for eligible users.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!eligible) {
      setEnabledState(false);
      return;
    }
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      setEnabledState(raw === "1");
    } catch {
      /* ignore */
    }
  }, [eligible]);

  const setEnabled = useCallback(
    (v: boolean) => {
      if (!eligible) {
        setEnabledState(false);
        return;
      }
      setEnabledState(v);
      try {
        window.sessionStorage.setItem(STORAGE_KEY, v ? "1" : "0");
      } catch {
        /* ignore */
      }
    },
    [eligible],
  );

  const toggle = useCallback(() => setEnabled(!enabled), [enabled, setEnabled]);

  const value = useMemo<DirectorModeCtx>(
    () => ({ eligible, enabled: eligible && enabled, setEnabled, toggle }),
    [eligible, enabled, setEnabled, toggle],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDirectorMode() {
  return useContext(Ctx);
}
