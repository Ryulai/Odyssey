// Shared RPG hierarchy constants — used by admin form, dashboard, and server validation.

export const PRIMARY_CLASSES = ["ranger", "warrior", "mage", "guardian"] as const;
export type PrimaryClass = (typeof PRIMARY_CLASSES)[number];

export const CLASS_ROLES: Record<PrimaryClass, string[]> = {
  ranger:   ["hunter", "sniper", "beacon"],
  warrior:  ["tanker", "alchemist", "blacksmith", "tinker"],
  mage:     ["battle mage", "spellcaster", "bard", "visual mage", "illusionist", "musician"],
  guardian: ["priest", "hr", "admin", "cashier"],
};

// Roles flagged as temporary in the sprint spec (retain naming, mark visually).
export const TEMPORARY_ROLES = new Set([
  "musician", "hr", "admin", "cashier",
]);

export const RANKS = [
  { key: "bronze",    label: "Bronze",    unlocked: true  },
  { key: "silver",    label: "Silver",    unlocked: false },
  { key: "gold",      label: "Gold",      unlocked: false },
  { key: "platinum",  label: "Platinum",  unlocked: false },
  { key: "diamond",   label: "Diamond",   unlocked: false },
  { key: "mystical",  label: "Mystical",  unlocked: false },
  { key: "legend",    label: "Legend",    unlocked: false },
] as const;

// Secondary career unlocks at Gold rank in the future.
export const SECONDARY_UNLOCK_RANK = "gold";

export function titleCase(v: string | null | undefined): string {
  if (!v) return "";
  return v.replace(/\b\w/g, (c) => c.toUpperCase());
}
