import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type UserRole = "director" | "manager" | "staff";

export const ROLE_META: Record<UserRole, { label: string; tagline: string; color: string }> = {
  director: { label: "Director", tagline: "Full access · approves promotions · edits all configuration", color: "var(--color-gold, gold)" },
  manager:  { label: "Manager",  tagline: "Manages own team · approves achievements · recommends promotions", color: "var(--color-rank-platinum, #9ecbff)" },
  staff:    { label: "Staff",    tagline: "Views own profile · own growth trees · submits achievement requests", color: "var(--color-rank-silver, #c0c4ce)" },
};

export const PERMISSIONS = {
  director: [
    "Full access to all modules",
    "Approve Manager promotions",
    "Edit all configurations (Staff, Grades, Achievements, Ranks, Legacy)",
  ],
  manager: [
    "Manage own team members",
    "Approve achievement submissions",
    "Submit promotion recommendations",
  ],
  staff: [
    "View own profile",
    "View own growth trees",
    "Submit achievement requests",
  ],
} as const;

/** Module-level capabilities used to gate admin tabs. */
export type Capability =
  | "admin.access"
  | "admin.staff"
  | "admin.grades"
  | "admin.achievements"
  | "admin.ranks"
  | "admin.legacy"
  | "team.manage"
  | "team.approveAchievements"
  | "team.recommendPromotion"
  | "promotions.approve";

const CAPS: Record<UserRole, Capability[]> = {
  director: [
    "admin.access", "admin.staff", "admin.grades", "admin.achievements", "admin.ranks", "admin.legacy",
    "team.manage", "team.approveAchievements", "team.recommendPromotion", "promotions.approve",
  ],
  manager: [
    "admin.access", "admin.staff", "admin.achievements",
    "team.manage", "team.approveAchievements", "team.recommendPromotion",
  ],
  staff: [],
};

export function can(role: UserRole, cap: Capability) {
  return CAPS[role].includes(cap);
}

/* ---------------- Context ---------------- */

interface RoleCtx {
  role: UserRole;
  setRole: (r: UserRole) => void;
}
const RoleContext = createContext<RoleCtx>({ role: "director", setRole: () => {} });

const STORAGE_KEY = "guild.role";

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("director");

  // Hydrate from localStorage AFTER mount to avoid SSR/CSR mismatch.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as UserRole | null;
    if (stored === "director" || stored === "manager" || stored === "staff") {
      setRoleState(stored);
    }
  }, []);

  function setRole(r: UserRole) {
    setRoleState(r);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, r);
  }

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return useContext(RoleContext);
}
