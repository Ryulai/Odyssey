import { useSyncExternalStore } from "react";
import { getState, subscribe, prototypeActions, getActiveProfile } from "./store";
import type { PrototypeProfile, PrototypeState } from "./types";

function getSnapshot(): PrototypeState {
  return getState();
}
function getServerSnapshot(): PrototypeState {
  return { enabled: false, activeProfileId: null, profiles: [] };
}

export function usePrototype() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const active: PrototypeProfile | null =
    state.enabled ? state.profiles.find((p) => p.id === state.activeProfileId) ?? null : null;
  return { ...state, active, actions: prototypeActions };
}

// Non-hook helper for modules that need a one-shot read
export function readActivePrototypeProfile(): PrototypeProfile | null {
  return getActiveProfile();
}
