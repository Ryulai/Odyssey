// Shared RPG hierarchy constants.
// IMPORTANT: The database stores KEYS (stable, lower_snake_case).
// Display names live only in this file, so they can be renamed or localized
// later without a schema migration.

export type LabeledKey = { key: string; label: string };

export const PRIMARY_CLASSES = [
  { key: "ranger",   label: "Ranger" },
  { key: "warrior",  label: "Warrior" },
  { key: "mage",     label: "Mage" },
  { key: "guardian", label: "Guardian" },
] as const;

export type PrimaryClass = (typeof PRIMARY_CLASSES)[number]["key"];

export const CLASS_ROLES: Record<PrimaryClass, LabeledKey[]> = {
  ranger: [
    { key: "hunter",  label: "Hunter" },
    { key: "sniper",  label: "Sniper" },
    { key: "beacon",  label: "Beacon" },
  ],
  warrior: [
    { key: "tanker",     label: "Tanker" },
    { key: "alchemist",  label: "Alchemist" },
    { key: "blacksmith", label: "Blacksmith" },
    { key: "tinker",     label: "Tinker" },
  ],
  mage: [
    { key: "battle_mage",  label: "Battle Mage" },
    { key: "spellcaster",  label: "Spellcaster" },
    { key: "bard",         label: "Bard" },
    { key: "visual_mage",  label: "Visual Mage" },
    { key: "illusionist",  label: "Illusionist" },
    { key: "musician",     label: "Musician" },
  ],
  guardian: [
    { key: "priest",  label: "Priest" },
    { key: "hr",      label: "HR" },
    { key: "admin",   label: "Admin" },
    { key: "cashier", label: "Cashier" },
  ],
};

// Roles flagged as temporary in the sprint spec.
export const TEMPORARY_ROLES = new Set<string>([
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

// Lifecycle states for a crew member. Stored as free text in the DB; the UI
// picker constrains input to this list.
export const STAFF_STATUSES = [
  { key: "trial",     label: "Trial" },
  { key: "active",    label: "Active" },
  { key: "on_leave",  label: "On Leave" },
  { key: "inactive",  label: "Inactive" },
  { key: "resigned",  label: "Resigned" },
] as const;

export type StaffStatus = (typeof STAFF_STATUSES)[number]["key"];

// Secondary career unlocks at Gold rank in the future.
export const SECONDARY_UNLOCK_RANK = "gold";

/* ---------- key → label helpers (UI ONLY) ---------- */

const CLASS_LABEL = new Map(PRIMARY_CLASSES.map(c => [c.key, c.label]));
const ROLE_LABEL = new Map<string, string>();
for (const roles of Object.values(CLASS_ROLES)) for (const r of roles) ROLE_LABEL.set(r.key, r.label);
const RANK_LABEL   = new Map(RANKS.map(r => [r.key, r.label]));
const STATUS_LABEL = new Map(STAFF_STATUSES.map(s => [s.key, s.label]));

// Accept either the new key ("battle_mage") or the legacy display form
// ("battle mage" / "Battle Mage") so old rows keep rendering.
function normalizeKey(v: string | null | undefined): string | null {
  if (!v) return null;
  return v.trim().toLowerCase().replace(/\s+/g, "_");
}

export function classLabel(key: string | null | undefined): string {
  const k = normalizeKey(key);
  return (k && CLASS_LABEL.get(k as PrimaryClass)) || "";
}
export function roleLabel(key: string | null | undefined): string {
  const k = normalizeKey(key);
  return (k && ROLE_LABEL.get(k)) || (k ? titleCase(k.replace(/_/g, " ")) : "");
}
export function rankLabel(key: string | null | undefined): string {
  const k = normalizeKey(key);
  return (k ? (RANK_LABEL.get(k as (typeof RANKS)[number]["key"]) ?? titleCase(k)) : "");
}
export function statusLabel(key: string | null | undefined): string {
  const k = normalizeKey(key);
  return (k ? (STATUS_LABEL.get(k as StaffStatus) ?? titleCase(k.replace(/_/g, " "))) : "");
}

export function titleCase(v: string | null | undefined): string {
  if (!v) return "";
  return v.replace(/\b\w/g, (c) => c.toUpperCase());
}
