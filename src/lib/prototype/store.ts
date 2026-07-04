// Client-only localStorage-backed store for Prototype Mode.
// No server, no network, no persistence beyond the current device.

import type { PrototypeProfile, PrototypeState } from "./types";
import { SEED_PROFILES, makeBlankProfile } from "./seed";

const KEY = "odyssey.prototype.v1";

const DEFAULT_STATE: PrototypeState = {
  enabled: false,
  activeProfileId: SEED_PROFILES[0]?.id ?? null,
  profiles: SEED_PROFILES,
};

let state: PrototypeState = DEFAULT_STATE;
let hydrated = false;
const listeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function hydrate() {
  if (hydrated || !isBrowser()) return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PrototypeState>;
      state = {
        enabled: Boolean(parsed.enabled),
        activeProfileId: parsed.activeProfileId ?? DEFAULT_STATE.activeProfileId,
        profiles: Array.isArray(parsed.profiles) && parsed.profiles.length ? parsed.profiles : SEED_PROFILES,
      };
    }
  } catch {
    state = DEFAULT_STATE;
  }
}

function persist() {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore quota / disabled storage
  }
}

function emit() {
  for (const l of listeners) l();
}

export function getState(): PrototypeState {
  hydrate();
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setState(next: PrototypeState) {
  state = next;
  persist();
  emit();
}

export const prototypeActions = {
  setEnabled(enabled: boolean) {
    hydrate();
    setState({ ...state, enabled });
  },
  toggle() {
    hydrate();
    setState({ ...state, enabled: !state.enabled });
  },
  setActiveProfile(id: string | null) {
    hydrate();
    setState({ ...state, activeProfileId: id });
  },
  updateProfile(id: string, patch: Partial<PrototypeProfile>) {
    hydrate();
    setState({
      ...state,
      profiles: state.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  },
  addProfile(): string {
    hydrate();
    const id = `demo-${Date.now().toString(36)}`;
    const p = makeBlankProfile(id);
    setState({ ...state, profiles: [...state.profiles, p], activeProfileId: id });
    return id;
  },
  removeProfile(id: string) {
    hydrate();
    const profiles = state.profiles.filter((p) => p.id !== id);
    const activeProfileId = state.activeProfileId === id ? (profiles[0]?.id ?? null) : state.activeProfileId;
    setState({ ...state, profiles, activeProfileId });
  },
  resetToSeed() {
    setState({ enabled: state.enabled, activeProfileId: SEED_PROFILES[0]?.id ?? null, profiles: SEED_PROFILES });
  },
  clearAll() {
    setState({ enabled: false, activeProfileId: null, profiles: [] });
  },
};

export function getActiveProfile(): PrototypeProfile | null {
  const s = getState();
  if (!s.enabled) return null;
  return s.profiles.find((p) => p.id === s.activeProfileId) ?? null;
}
