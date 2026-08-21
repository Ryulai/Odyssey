import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * LEGACY / HISTORICAL achievement maintenance.
 *
 * These functions never touch the 8 Frozen Season One achievements: they only
 * expose inactive (legacy) achievements such as "First Blood" so a Director can
 * correct the award/claim DATE of existing historical rows. Definitions,
 * rewards and star rules are never modified here.
 */

async function assertDirector(context: any) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "director",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Director authority required.");
}

export const listLegacyAchievements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertDirector(context);

    const cat = await context.supabase
      .from("achievements")
      .select("id, name, description, star_reward, active")
      .eq("active", false)
      .order("name");
    if (cat.error) throw new Error(cat.error.message);
    const legacy = cat.data ?? [];
    if (!legacy.length) return [];

    const ids = legacy.map((a) => a.id);
    const [recs, claims, staff] = await Promise.all([
      context.supabase
        .from("achievement_records")
        .select("id, staff_id, achievement_id, period, stars, awarded_at")
        .in("achievement_id", ids)
        .order("awarded_at", { ascending: false }),
      context.supabase
        .from("achievement_claims")
        .select("id, staff_id, achievement_id, status, created_at, decided_at")
        .in("achievement_id", ids)
        .order("created_at", { ascending: false }),
      context.supabase.from("staff").select("id, name"),
    ]);
    if (recs.error) throw new Error(recs.error.message);
    if (claims.error) throw new Error(claims.error.message);
    if (staff.error) throw new Error(staff.error.message);

    const nameOf = (id: string) => staff.data?.find((s) => s.id === id)?.name ?? "Unknown";

    return legacy.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description ?? "",
      star_reward: Number(a.star_reward ?? 0),
      records: (recs.data ?? [])
        .filter((r) => r.achievement_id === a.id)
        .map((r) => ({ ...r, staff_name: nameOf(r.staff_id) })),
      claims: (claims.data ?? [])
        .filter((c) => c.achievement_id === a.id)
        .map((c) => ({ ...c, staff_name: nameOf(c.staff_id) })),
    }));
  });

export const updateLegacyAchievementDate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    kind: "record" | "claim";
    id: string;
    /** ISO datetime for awarded_at (record) or created_at (claim). */
    date: string;
    /** Optional display period label, records only. */
    period?: string;
    reason: string;
  }) => {
    if (!d.id) throw new Error("Missing row id.");
    if (!d.date || Number.isNaN(Date.parse(d.date))) throw new Error("Invalid date.");
    if (!d.reason?.trim()) throw new Error("A reason is required for historical corrections.");
    return d;
  })
  .handler(async ({ context, data }) => {
    await assertDirector(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const table = data.kind === "record" ? "achievement_records" : "achievement_claims";
    const before = await supabaseAdmin.from(table).select("*").eq("id", data.id).maybeSingle();
    if (before.error) throw new Error(before.error.message);
    if (!before.data) throw new Error("Historical row not found.");

    // Refuse to touch anything that is not a legacy (inactive) achievement.
    const ach = await supabaseAdmin
      .from("achievements")
      .select("id, name, active")
      .eq("id", (before.data as any).achievement_id)
      .maybeSingle();
    if (ach.error) throw new Error(ach.error.message);
    if (!ach.data || ach.data.active) {
      throw new Error("Only legacy (inactive) achievements can be date-corrected here.");
    }

    const iso = new Date(data.date).toISOString();
    const patch: Record<string, unknown> =
      data.kind === "record"
        ? { awarded_at: iso, ...(data.period !== undefined ? { period: data.period } : {}) }
        : { created_at: iso };

    const after = await (supabaseAdmin.from(table) as any).update(patch).eq("id", data.id).select().maybeSingle();
    if (after.error) throw new Error(after.error.message);

    await supabaseAdmin.from("director_audit_log").insert({
      actor_user_id: context.userId,
      staff_id: (before.data as any).staff_id ?? null,
      action: `legacy_achievement_${data.kind}_date_edit`,
      reason: data.reason.trim(),
      before_state: { achievement: ach.data.name, row: before.data },
      after_state: { achievement: ach.data.name, row: after.data },
    });

    return { ok: true, row: after.data };
  });
