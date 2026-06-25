import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ============ Staff ============ */
export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("staff").select("*").order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string; name: string; email?: string | null; role: string;
    role_family: "hunter" | "operational"; department: string; manager_id?: string | null;
  }) => d)
  .handler(async ({ context, data }) => {
    const payload = { ...data, manager_id: data.manager_id || null, email: data.email ?? null };
    const { data: row, error } = await context.supabase
      .from("staff").upsert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("staff").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ Grades ============ */
export const getGradeConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [weights, rules] = await Promise.all([
      context.supabase.from("grade_weights").select("*").eq("id", 1).maybeSingle(),
      context.supabase.from("grade_rules").select("*").order("min_score", { ascending: false }),
    ]);
    if (weights.error) throw new Error(weights.error.message);
    if (rules.error) throw new Error(rules.error.message);
    return {
      weights: weights.data ?? { id: 1, sales_weight: 60, review_weight: 40 },
      rules: rules.data ?? [],
    };
  });

export const updateGradeWeights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sales_weight: number; review_weight: number }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("grade_weights")
      .upsert({ id: 1, ...data });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateGradeRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { grade: "A" | "B" | "C" | "D"; min_score: number; bonus_pct: number; note: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("grade_rules").upsert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ Achievements ============ */
export const listAchievements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("achievements").select("*").order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertAchievement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string; name: string; description: string; type: string; difficulty: string;
    reset_cycle: string; star_reward: number; requirement: string; seasonal: boolean;
  }) => d)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("achievements").upsert(data).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteAchievement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("achievements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ Ranks ============ */
export const listRanks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("ranks").select("*").order("position");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateRank = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    key: string; name: string; subtitle: string; description: string;
    requirement: string; locked: boolean; position: number;
  }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("ranks").upsert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderRanks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { items: { key: string; position: number }[] }) => d)
  .handler(async ({ context, data }) => {
    for (const it of data.items) {
      const { error } = await context.supabase.from("ranks").update({ position: it.position }).eq("key", it.key);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* ============ Legacy ============ */
export const getLegacy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [cfg, titles] = await Promise.all([
      context.supabase.from("legacy_config").select("*").eq("id", 1).maybeSingle(),
      context.supabase.from("legacy_titles").select("*").order("min_stars"),
    ]);
    if (cfg.error) throw new Error(cfg.error.message);
    if (titles.error) throw new Error(titles.error.message);
    return {
      config: cfg.data ?? { id: 1, stars_per_moon: 10, moons_per_sun: 5 },
      titles: titles.data ?? [],
    };
  });

export const updateLegacyConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { stars_per_moon: number; moons_per_sun: number }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("legacy_config").upsert({ id: 1, ...data });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertLegacyTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; name: string; min_stars: number; flavor: string; position: number }) => d)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("legacy_titles").upsert(data).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteLegacyTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("legacy_titles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
