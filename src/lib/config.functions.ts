import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AppRole = "director" | "manager" | "staff";

async function currentUserRole(context: any): Promise<AppRole | null> {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: any) => r.role as AppRole);
  return (["director", "manager", "staff"] as AppRole[]).find((r) => roles.includes(r)) ?? null;
}

async function currentStaffId(context: any): Promise<string | null> {
  const { data, error } = await context.supabase
    .from("staff")
    .select("id")
    .eq("user_id", context.userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

function requireDirector(role: AppRole | null) {
  if (role !== "director") throw new Error("Forbidden — Director access required.");
}

function requireManagerOrDirector(role: AppRole | null) {
  if (role !== "director" && role !== "manager") throw new Error("Forbidden — Manager or Director access required.");
}

async function resolveProfileByEmailOrId(context: any, userId?: string | null, email?: string | null) {
  if (userId) return userId;
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;
  const { data, error } = await context.supabase
    .from("profiles")
    .select("id")
    .ilike("email", normalized)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

async function replaceUserRole(context: any, userId: string, role: AppRole) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (role !== "director") {
    const { data: currentRoles, error: currentError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (currentError) throw new Error(currentError.message);
    const isCurrentlyDirector = (currentRoles ?? []).some((r: any) => r.role === "director");
    if (isCurrentlyDirector) {
      const { count, error: countError } = await supabaseAdmin
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "director")
        .neq("user_id", userId);
      if (countError) throw new Error(countError.message);
      if ((count ?? 0) === 0) throw new Error("Cannot remove the final Director. Assign another Director first.");
    }
  }
  const { error: roleError } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
  if (roleError) throw new Error(roleError.message);
  const { error: delError } = await supabaseAdmin
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .neq("role", role);
  if (delError) throw new Error(delError.message);
}

/* ============ Staff ============ */
export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const actorRole = await currentUserRole(context);
    requireManagerOrDirector(actorRole);
    let query = context.supabase.from("staff").select("*");
    if (actorRole === "manager") {
      const actorStaffId = await currentStaffId(context);
      if (!actorStaffId) return [];
      query = query.or(`manager_id.eq.${actorStaffId},id.eq.${actorStaffId}`);
    }
    const { data, error } = await query.order("name");
    if (error) throw new Error(error.message);
    if (actorRole !== "director") return data ?? [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (roleError) throw new Error(roleError.message);
    const rank = { director: 1, manager: 2, staff: 3 } as Record<AppRole, number>;
    return (data ?? []).map((s: any) => {
      const ownRoles = (roles ?? []).filter((r: any) => r.user_id === s.user_id).map((r: any) => r.role as AppRole);
      ownRoles.sort((a: AppRole, b: AppRole) => rank[a] - rank[b]);
      return { ...s, app_role: ownRoles[0] ?? s.system_role ?? null };
    });
  });

export const listUserAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requireDirector(await currentUserRole(context));
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("email");
    if (error) throw new Error(error.message);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (roleError) throw new Error(roleError.message);
    const rank = { director: 1, manager: 2, staff: 3 } as Record<AppRole, number>;
    return (data ?? []).map((p: any) => {
      const ownRoles = (roles ?? []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role as AppRole);
      ownRoles.sort((a: AppRole, b: AppRole) => rank[a] - rank[b]);
      return { ...p, role: ownRoles[0] ?? "staff" };
    });
  });

export const upsertStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string; name: string; email?: string | null; role: string;
    role_family: "hunter" | "operational"; department: string; manager_id?: string | null;
    status?: "active" | "inactive"; user_id?: string | null; app_role?: AppRole | null;
    location_id?: string | null;
  }) => d)

  .handler(async ({ context, data }) => {
    const actorRole = await currentUserRole(context);
    requireManagerOrDirector(actorRole);
    const isDirector = actorRole === "director";
    const actorStaffId = actorRole === "manager" ? await currentStaffId(context) : null;
    if (actorRole === "manager" && !actorStaffId) throw new Error("Manager account is not linked to a staff record.");
    if (actorRole === "manager" && data.id) {
      const { data: existing, error: existingError } = await context.supabase
        .from("staff")
        .select("id, manager_id")
        .eq("id", data.id)
        .maybeSingle();
      if (existingError) throw new Error(existingError.message);
      if (!existing || existing.manager_id !== actorStaffId) throw new Error("Forbidden — managers may only update their own team.");
    }
    const linkedUserId = isDirector ? await resolveProfileByEmailOrId(context, data.user_id, data.email) : undefined;
    const payload: any = {
      id: data.id,
      name: data.name,
      email: data.email?.trim().toLowerCase() || null,
      role: data.role,
      role_family: data.role_family,
      department: data.department,
      manager_id: actorRole === "manager" ? actorStaffId : (data.manager_id || null),
      status: data.status ?? "active",
      location_id: data.location_id ?? null,

    };
    if (isDirector) payload.user_id = linkedUserId ?? null;
    if (isDirector) payload.system_role = data.app_role ?? "staff";
    const { data: row, error } = await context.supabase
      .from("staff").upsert(payload).select().single();
    if (error) throw new Error(error.message);
    if (linkedUserId && data.app_role && actorRole === "director") {
      await replaceUserRole(context, linkedUserId, data.app_role);
    }
    return row;
  });

export const linkStaffAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { staff_id: string; user_id: string | null; app_role?: AppRole | null }) => d)
  .handler(async ({ context, data }) => {
    requireDirector(await currentUserRole(context));
    const { data: row, error } = await context.supabase
      .from("staff")
      .update({ user_id: data.user_id, ...(data.app_role ? { system_role: data.app_role } : {}) })
      .eq("id", data.staff_id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (data.user_id && data.app_role) await replaceUserRole(context, data.user_id, data.app_role);
    return row;
  });

export const deleteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    requireDirector(await currentUserRole(context));
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
    min_total_stars?: number; min_a_grades?: number; min_b_grades?: number; min_achievements?: number;
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

/* ============ Locations / Fleets ============ */
export const listLocations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("locations").select("*").order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string; name: string; code?: string | null; kind?: string;
    manager_id?: string | null; notes?: string | null; status?: "active" | "inactive";
  }) => d)
  .handler(async ({ context, data }) => {
    requireDirector(await currentUserRole(context));
    const payload: any = {
      name: data.name,
      code: data.code ?? null,
      kind: data.kind ?? "venue",
      manager_id: data.manager_id ?? null,
      notes: data.notes ?? null,
      status: data.status ?? "active",
    };
    if (data.id) payload.id = data.id;
    const { data: row, error } = await context.supabase.from("locations").upsert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    requireDirector(await currentUserRole(context));
    const { error } = await context.supabase.from("locations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
