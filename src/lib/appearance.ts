import { useSyncExternalStore } from "react";

// ─── Types ──────────────────────────────────────────────────────────────

export type PortraitKind = "default" | "photo" | "avatar" | "emblem";

export type Portrait =
  | { kind: "default" }
  | { kind: "photo"; dataUrl: string }
  | { kind: "avatar"; id: string }
  | { kind: "emblem"; id: string };

// ─── Default Odyssey avatars (placeholders, glyph-based) ───────────────

export type AvatarOption = { id: string; label: string; glyph: string; tone: string };

export const DEFAULT_AVATARS: AvatarOption[] = [
  { id: "wanderer",  label: "Wanderer",   glyph: "☾", tone: "#C7CBD1" },
  { id: "voyager",   label: "Voyager",    glyph: "⚓", tone: "#B9F2FF" },
  { id: "seeker",    label: "Seeker",     glyph: "✦", tone: "#D4A84B" },
  { id: "flame",     label: "Flame",      glyph: "❦", tone: "#E27D5A" },
  { id: "raven",     label: "Raven",      glyph: "☾", tone: "#8892A6" },
  { id: "aurora",    label: "Aurora",     glyph: "❈", tone: "#C9A6FF" },
  { id: "ember",     label: "Ember",      glyph: "✺", tone: "#F5C46B" },
  { id: "tide",      label: "Tide",       glyph: "≈", tone: "#7FB8C9" },
];

// ─── Guild Emblems (placeholder glyphs; art comes later) ───────────────

export type EmblemOption = { id: string; label: string; glyph: string; tone: string };

export const GUILD_EMBLEMS: EmblemOption[] = [
  { id: "hunter",    label: "Hunter",    glyph: "🏹", tone: "#8FBF7A" },
  { id: "mage",      label: "Mage",      glyph: "✶", tone: "#C9A6FF" },
  { id: "vanguard",  label: "Vanguard",  glyph: "⚔", tone: "#E5E4E2" },
  { id: "craftsman", label: "Craftsman", glyph: "⚒", tone: "#D4A84B" },
  { id: "scholar",   label: "Scholar",   glyph: "❦", tone: "#B9F2FF" },
  { id: "guardian",  label: "Guardian",  glyph: "⛨", tone: "#F5D07A" },
  { id: "ranger",    label: "Ranger",    glyph: "❧", tone: "#8FBF7A" },
  { id: "alchemist", label: "Alchemist", glyph: "⚗", tone: "#C9A6FF" },
  { id: "navigator", label: "Navigator", glyph: "✧", tone: "#B9F2FF" },
];

// ─── Portrait Frames (cosmetic, freely selectable in this prototype) ────

export type FrameId = "none" | "bronze" | "silver" | "gold" | "diamond";

export type FrameOption = {
  id: FrameId;
  label: string;
  ring: string;          // primary border colour
  accent: string;        // inner accent ring colour
  glow: string;          // outer glow colour (rgba)
  style: "solid" | "double" | "engraved" | "prismatic";
};

export const PORTRAIT_FRAMES: FrameOption[] = [
  { id: "none",    label: "No Frame",       ring: "rgba(197,160,89,0.35)", accent: "transparent",        glow: "rgba(0,0,0,0)",         style: "solid" },
  { id: "bronze",  label: "Bronze Frame",   ring: "#B87333",               accent: "#7A4A22",            glow: "rgba(184,115,51,0.45)", style: "solid" },
  { id: "silver",  label: "Silver Frame",   ring: "#D9DCE1",               accent: "#8892A6",            glow: "rgba(217,220,225,0.45)",style: "double" },
  { id: "gold",    label: "Gold Frame",     ring: "#F5C46B",               accent: "#8A5A1A",            glow: "rgba(245,196,107,0.55)",style: "engraved" },
  { id: "diamond", label: "Diamond Frame",  ring: "#B9F2FF",               accent: "#C9A6FF",            glow: "rgba(185,242,255,0.60)",style: "prismatic" },
];

export function findFrame(id: string | null | undefined): FrameOption {
  return PORTRAIT_FRAMES.find((f) => f.id === id) ?? PORTRAIT_FRAMES[0];
}

// ─── Future locked cosmetics ────────────────────────────────────────────

export type LockedCosmetic = { id: string; label: string; category: string; hint: string };

export const LOCKED_COSMETICS: LockedCosmetic[] = [
  { id: "frame-black-gold", label: "Black Gold Frame",   category: "Portrait Frame", hint: "Reach Black Rank" },
  { id: "frame-founder",    label: "Founder Frame",      category: "Legacy",         hint: "Shipbuilder title" },
  { id: "frame-top-sales",  label: "Top Sales Frame",    category: "Seasonal",       hint: "#1 quarterly performer" },
  { id: "frame-seasonal",   label: "Seasonal Frame",     category: "Event",          hint: "Limited-time event reward" },
  { id: "badge-achievement",label: "Achievement Badge",  category: "Badges",         hint: "Earned via voyages" },
  { id: "cosmetic-event",   label: "Event Cosmetics",    category: "Event",          hint: "Guild-wide celebrations" },
  { id: "fx-animated",      label: "Animated Portrait",  category: "Effects",        hint: "Legendary status reward" },
];

// ─── Storage (per-user localStorage) ────────────────────────────────────

const KEY = "odyssey.appearance.v1";
const DEFAULT: Portrait = { kind: "default" };

// Cache the parsed snapshot so useSyncExternalStore sees a stable reference
// until the underlying stored string actually changes. Returning a fresh
// object every read causes React to loop ("Maximum update depth exceeded").
let cachedRaw: string | null = null;
let cachedSnapshot: Portrait = DEFAULT;

function isValidPortrait(p: unknown): p is Portrait {
  if (!p || typeof p !== "object" || !("kind" in p)) return false;
  const kind = (p as { kind: unknown }).kind;
  if (kind === "default") return true;
  if (kind === "photo") return typeof (p as { dataUrl?: unknown }).dataUrl === "string";
  if (kind === "avatar" || kind === "emblem") return typeof (p as { id?: unknown }).id === "string";
  return false;
}

function read(): Portrait {
  if (typeof window === "undefined") return DEFAULT;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return cachedSnapshot;
  }
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  if (!raw) {
    cachedSnapshot = DEFAULT;
    return cachedSnapshot;
  }
  try {
    const parsed = JSON.parse(raw);
    cachedSnapshot = isValidPortrait(parsed) ? parsed : DEFAULT;
  } catch {
    cachedSnapshot = DEFAULT;
  }
  return cachedSnapshot;
}

export function setPortrait(p: Portrait) {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(p);
    window.localStorage.setItem(KEY, raw);
    // Prime the cache so the very next read returns the exact same reference.
    cachedRaw = raw;
    cachedSnapshot = p;
    window.dispatchEvent(new Event("odyssey:appearance"));
  } catch (err) {
    console.warn("[appearance] failed to persist portrait", err);
  }
}

export function resetPortrait() {
  setPortrait(DEFAULT);
}

function subscribe(cb: () => void) {
  window.addEventListener("odyssey:appearance", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("odyssey:appearance", cb);
    window.removeEventListener("storage", cb);
  };
}

export function usePortrait(): Portrait {
  return useSyncExternalStore(subscribe, read, () => DEFAULT);
}

// ─── Lookup helpers ─────────────────────────────────────────────────────

export function findAvatar(id: string) {
  return DEFAULT_AVATARS.find((a) => a.id === id);
}
export function findEmblem(id: string) {
  return GUILD_EMBLEMS.find((e) => e.id === id);
}
