// Prototype rank ladder — every rank unlocked. Used only by Prototype Mode UI.
// The production ladder in src/lib/rpg.ts is untouched.

export type PrototypeRank = {
  key: string;
  label: string;
  glyph: string;
  color: string;
  identity: string;
};

export const PROTOTYPE_RANKS: PrototypeRank[] = [
  { key: "apprentice", label: "Apprentice", glyph: "✧", color: "#B8BFC7", identity: "I Am Learning The Ropes." },
  { key: "bronze",     label: "Bronze",     glyph: "🥉", color: "#B87333", identity: "I Can Do It." },
  { key: "silver",     label: "Silver",     glyph: "🥈", color: "#C8CDD4", identity: "You Can Trust Me." },
  { key: "gold",       label: "Gold",       glyph: "🥇", color: "#F5D07A", identity: "I Can Help Others Grow." },
  { key: "platinum",   label: "Platinum",   glyph: "◆",  color: "#B8D4E3", identity: "I Set The Standard." },
  { key: "diamond",    label: "Diamond",    glyph: "💎", color: "#8FE3E8", identity: "I Shape The Craft." },
  { key: "master",     label: "Master",     glyph: "❖",  color: "#E8C87A", identity: "I Have Mastered The Path." },
  { key: "mystical",   label: "Mystical",   glyph: "✦",  color: "#C9A6FF", identity: "I Guide The Fleet." },
  { key: "legend",     label: "Legend",     glyph: "☀",  color: "#F4E9C1", identity: "My Story Guides The Next Voyage." },
];

export const PROTOTYPE_RANK_KEYS = PROTOTYPE_RANKS.map((r) => r.key);

export function prototypeRank(key: string | null | undefined): PrototypeRank | undefined {
  if (!key) return undefined;
  return PROTOTYPE_RANKS.find((r) => r.key === key.toLowerCase());
}
