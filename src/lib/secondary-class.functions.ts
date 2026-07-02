/**
 * SYSTEM 3 — Secondary Career (engine stub)
 *
 * A secondary career is a complete second profession, tracked independently
 * of the main career. Same calculation shape as the main-career engines
 * (Performance + Ranking) but scoped by `(staff_id, career_slot)`.
 *
 * The DB currently stores the *chosen* secondary class/role on `rpg_identity`
 * (columns: secondary_class, secondary_role, secondary_unlocked). Independent
 * performance history and rank progression for the secondary slot will use
 * dedicated tables in a future migration — this file reserves the surface
 * area so pages/components can import from a stable path.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CareerSlot = "main" | "secondary";

export interface SecondaryCareerSnapshot {
  unlocked: boolean;
  unlock_rank_key: string;      // rank key required to unlock (e.g. "gold")
  class_key: string | null;     // chosen secondary class, if any
  role_key: string | null;      // chosen secondary role, if any
  // Independent System 1 / System 2 state for this slot (placeholder for now).
  performance: null;
  ranking: null;
}

/** Read the secondary-career snapshot for the current user's linked staff. */
export const getMySecondaryCareer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SecondaryCareerSnapshot> => {
    const { data: staff } = await context.supabase
      .from("staff")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!staff) {
      return {
        unlocked: false,
        unlock_rank_key: "gold",
        class_key: null,
        role_key: null,
        performance: null,
        ranking: null,
      };
    }

    const { data: rpg } = await context.supabase
      .from("rpg_identity")
      .select("secondary_class, secondary_role, secondary_unlocked")
      .eq("staff_id", staff.id)
      .maybeSingle();

    return {
      unlocked: !!rpg?.secondary_unlocked,
      unlock_rank_key: "gold",
      class_key: rpg?.secondary_class ?? null,
      role_key: rpg?.secondary_role ?? null,
      performance: null,
      ranking: null,
    };
  });
