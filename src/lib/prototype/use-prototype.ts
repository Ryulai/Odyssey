import { useSyncExternalStore } from "react";
import { getState, subscribe, prototypeActions, getActiveProfile } from "./store";
import type { PrototypeProfile, PrototypeState } from "./types";

function getSnapshot(): PrototypeState {
  return getState();
}
const SERVER_SNAPSHOT: PrototypeState = { enabled: false, activeProfileId: null, profiles: [] };
function getServerSnapshot(): PrototypeState {
  return SERVER_SNAPSHOT;
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
