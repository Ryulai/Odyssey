import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "director" | "manager" | "staff";

export const ROLE_META: Record<UserRole, { label: string; tagline: string; color: string }> = {
  director: { label: "Director", tagline: "Full access · approves promotions · edits all configuration", color: "var(--color-gold, gold)" },
  manager:  { label: "Manager",  tagline: "Manages own team · approves achievements · recommends promotions", color: "var(--color-rank-platinum, #9ecbff)" },
  staff:    { label: "Staff",    tagline: "Views own profile · own growth trees · submits achievement requests", color: "var(--color-rank-silver, #c0c4ce)" },
};

export const PERMISSIONS = {
  director: [
    "Full access",
    "Create Managers and Staff",
    "Approve promotions",
    "Manage configuration",
  ],
  manager: [
    "Manage own team",
    "Review achievement claims",
    "Recommend promotions",
  ],
  staff: [
    "View profile",
    "Submit achievement claims",
    "View growth tree",
  ],
} as const;

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
  | "promotions.approve"
  | "claims.submit"
  | "claims.review"
  | "evaluations.write";

const CAPS: Record<UserRole, Capability[]> = {
  director: [
    "admin.access", "admin.staff", "admin.grades", "admin.achievements", "admin.ranks", "admin.legacy",
    "team.manage", "team.approveAchievements", "team.recommendPromotion", "promotions.approve",
    "claims.submit", "claims.review", "evaluations.write",
  ],
  manager: [
    "admin.access", "admin.staff",
    "team.manage", "team.approveAchievements", "team.recommendPromotion",
    "claims.submit", "claims.review", "evaluations.write",
  ],
  staff: ["claims.submit"],
};

export function can(role: UserRole | null | undefined, cap: Capability) {
  if (!role) return false;
  return CAPS[role].includes(cap);
}

interface AuthCtx {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null, user: null, role: null, loading: true,
  refreshRole: async () => {}, signOut: async () => {},
});

async function fetchRoleFor(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error || !data?.length) return null;
  const order: UserRole[] = ["director", "manager", "staff"];
  const roles = data.map((r) => r.role as UserRole);
  return order.find((r) => roles.includes(r)) ?? null;
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        // Defer DB call out of the auth callback
        setTimeout(() => {
          fetchRoleFor(s.user.id).then((r) => mounted && setRole(r));
        }, 0);
      } else {
        setRole(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        fetchRoleFor(data.session.user.id).then((r) => {
          if (!mounted) return;
          setRole(r);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const refreshRole = useCallback(async () => {
    if (!session?.user) return;
    const r = await fetchRoleFor(session.user.id);
    setRole(r);
  }, [session]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setRole(null);
    setSession(null);
  }, []);

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, role, loading, refreshRole, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() { return useContext(Ctx); }
/** Back-compat: existing code reads `useRole().role`. */
export function useRole() {
  const { role } = useContext(Ctx);
  return { role: (role ?? "staff") as UserRole, setRole: (_: UserRole) => {} };
}
