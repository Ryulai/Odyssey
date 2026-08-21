// ============================================================================
// FROZEN ODYSSEY IDENTITY TAXONOMY (compatibility layer)
//
//   Department  → the four career domains: Warrior, Mage, Priest, Ranger
//   Class       → a career inside a Department (Hunter, Sniper, Vanguard, …)
//   Role/Authority → organizational access: Staff, Manager, Director
//
// There is NO "Profession" layer.
//
// DATABASE COMPATIBILITY (no columns renamed):
//   staff_identities.class_key / rpg_identity.primary_class  ==> DEPARTMENT key
//   staff_identities.role_key  / rpg_identity.primary_role   ==> CLASS key
//   user_roles.role                                          ==> ROLE/AUTHORITY
//
// The legacy department key stored as "guardian" IS the Priest department.
// Both keys are accepted on read; "guardian" stays the persisted value so no
// existing rows or validation triggers break.
// ============================================================================

import { CLASS_ROLES, type LabeledKey } from "@/lib/rpg";

export type DepartmentKey = "warrior" | "mage" | "priest" | "ranger";

export type Department = {
  key: DepartmentKey;
  label: string;
  glyph: string;
  /** Value persisted in class_key / primary_class today. */
  dbKey: string;
};

export const DEPARTMENTS: Department[] = [
  { key: "warrior", label: "Warrior", glyph: "⚔", dbKey: "warrior" },
  { key: "mage", label: "Mage", glyph: "🔮", dbKey: "mage" },
  { key: "priest", label: "Priest", glyph: "🛡", dbKey: "guardian" },
  { key: "ranger", label: "Ranger", glyph: "🏹", dbKey: "ranger" },
];

export const DEPARTMENT_KEYS = DEPARTMENTS.map((d) => d.key);

export function normalizeKey(v: string | null | undefined): string | null {
  if (!v) return null;
  const k = v.trim().toLowerCase().replace(/\s+/g, "_");
  return k || null;
}

/** Accepts either a department key or a legacy DB value ("guardian"). */
export function toDepartmentKey(v: string | null | undefined): DepartmentKey | null {
  const k = normalizeKey(v);
  if (!k) return null;
  if (k === "guardian") return "priest";
  return (DEPARTMENT_KEYS as string[]).includes(k) ? (k as DepartmentKey) : null;
}

/** The value to compare against / write to the DB for a department. */
export function departmentDbKey(dep: DepartmentKey): string {
  return DEPARTMENTS.find((d) => d.key === dep)?.dbKey ?? dep;
}

export function departmentLabel(v: string | null | undefined): string {
  const k = toDepartmentKey(v);
  return k ? DEPARTMENTS.find((d) => d.key === k)!.label : "";
}

/** Classes of a Department, sourced from the existing configuration only. */
export function classesOf(dep: DepartmentKey | null | undefined): LabeledKey[] {
  if (!dep) return [];
  const dbKey = departmentDbKey(dep) as keyof typeof CLASS_ROLES;
  return (CLASS_ROLES[dbKey] ?? []) as LabeledKey[];
}

const CLASS_LABELS = new Map<string, string>();
for (const list of Object.values(CLASS_ROLES)) for (const c of list) CLASS_LABELS.set(c.key, c.label);

export function odysseyClassLabel(v: string | null | undefined): string {
  const k = normalizeKey(v);
  if (!k) return "";
  return CLASS_LABELS.get(k) ?? k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Department that owns a given class key, or null when unknown. */
export function departmentOfClass(classKey: string | null | undefined): DepartmentKey | null {
  const k = normalizeKey(classKey);
  if (!k) return null;
  for (const dep of DEPARTMENTS) {
    if ((CLASS_ROLES[dep.dbKey as keyof typeof CLASS_ROLES] ?? []).some((c) => c.key === k)) return dep.key;
  }
  return null;
}

export type Authority = "staff" | "manager" | "director";
export const AUTHORITY_LABELS: Record<Authority, string> = {
  staff: "Staff",
  manager: "Manager",
  director: "Director",
};
