import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RankEvaluation = {
  current_rank_key: string | null;
  current_rank_name: string | null;
  next_rank_key: string | null;
  next_rank_name: string | null;
  total_stars: number;
  a_grades: number;
  b_grades: number;
  unique_achievements: number;
  next_min_total_stars: number;
  next_min_a_grades: number;
  next_min_b_grades: number;
  next_min_achievements: number;
  eligible: boolean;
};

export const evaluateRank = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { staff_id: string }) => d)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .rpc("evaluate_rank", { _staff_id: data.staff_id })
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as RankEvaluation | null;
  });

/**
 * Real dashboard payload for the signed-in user (or any staff a manager/director picks).
 * Stars → Moons → Suns and current Legacy title are derived from configured ratios.
 */
export const getStaffDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { staff_id?: string }) => d)
  .handler(async ({ context, data }) => {
    // Resolve which staff row we are loading.
    let staffId = data.staff_id ?? "";
    if (!staffId) {
      const me = await context.supabase
        .from("staff")
        .select("id")
        .eq("user_id", context.userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (me.error) throw new Error(me.error.message);
      staffId = me.data?.id ?? "";

      if (!staffId) {
        const profile = await context.supabase
          .from("profiles")
          .select("email")
          .eq("id", context.userId)
          .maybeSingle();
        if (profile.error) throw new Error(profile.error.message);
        const email = profile.data?.email?.trim().toLowerCase();
        if (email) {
          const candidate = await context.supabase
            .from("staff")
            .select("id, user_id")
            .eq("email", email)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (candidate.error) throw new Error(candidate.error.message);
          if (candidate.data?.id && !candidate.data.user_id) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const linked = await supabaseAdmin
              .from("staff")
              .update({ user_id: context.userId })
              .eq("id", candidate.data.id)
              .is("user_id", null)
              .select("id")
              .maybeSingle();
            if (linked.error) throw new Error(linked.error.message);
            staffId = linked.data?.id ?? candidate.data.id;
          } else {
            staffId = candidate.data?.id ?? "";
          }
        }
      }
    }
    if (!staffId) {
      return { staff: null, totals: null, evaluation: null, records: [], grades: [], legacy: null, holdings: [], claims: { pending: 0, approved: 0, rejected: 0 } };
    }

    const [staffRes, recordsRes, gradesRes, evalRes, legacyCfg, legacyTitles, claimsRes, holdingsRes] = await Promise.all([
      context.supabase.from("staff").select("*").eq("id", staffId).maybeSingle(),
      context.supabase
        .from("achievement_records")
        .select("*, achievement:achievements(name, star_reward, type)")
        .eq("staff_id", staffId)
        .order("awarded_at", { ascending: false })
        .limit(20),
      context.supabase
        .from("monthly_evaluations")
        .select("month, grade, composite_score, sales_score, review_score")
        .eq("staff_id", staffId)
        .order("month", { ascending: false })
        .limit(12),
      context.supabase.rpc("evaluate_rank", { _staff_id: staffId }).maybeSingle(),
      context.supabase.from("legacy_config").select("*").eq("id", 1).maybeSingle(),
      context.supabase.from("legacy_titles").select("*").order("min_stars"),
      context.supabase
        .from("achievement_claims")
        .select("status")
        .eq("staff_id", staffId),
      context.supabase
        .from("legacy_holdings")
        .select("*, location:locations(id, name, code)")
        .eq("staff_id", staffId)
        .order("granted_at", { ascending: false, nullsFirst: false }),
    ]);
    for (const r of [staffRes, recordsRes, gradesRes, evalRes, legacyCfg, legacyTitles, claimsRes, holdingsRes]) {
      if ((r as any).error) throw new Error((r as any).error.message);
    }

    let rank = null as any;
    let manager = null as any;
    if (staffRes.data?.current_rank_key) {
      const rankRes = await context.supabase.from("ranks").select("*").eq("key", staffRes.data.current_rank_key).maybeSingle();
      if (rankRes.error) throw new Error(rankRes.error.message);
      rank = rankRes.data ?? null;
    }
    if (staffRes.data?.manager_id) {
      const managerRes = await context.supabase.from("staff").select("id, name, role, email").eq("id", staffRes.data.manager_id).maybeSingle();
      if (managerRes.error) throw new Error(managerRes.error.message);
      manager = managerRes.data ?? null;
    }

    const evaluation = (evalRes.data ?? null) as RankEvaluation | null;
    const totalStars = evaluation?.total_stars ?? 0;
    const cfg = legacyCfg.data ?? { stars_per_moon: 10, moons_per_sun: 5 };
    const moonsTotal = Math.floor(totalStars / cfg.stars_per_moon);
    const sunsTotal = Math.floor(moonsTotal / cfg.moons_per_sun);
    const moonsRemainder = moonsTotal % cfg.moons_per_sun;
    const starsRemainder = totalStars % cfg.stars_per_moon;
    const titles = (legacyTitles.data ?? []) as Array<{ id: string; name: string; min_stars: number; flavor: string }>;
    const sorted = [...titles].sort((a, b) => a.min_stars - b.min_stars);
    let currentTitle = null as null | typeof sorted[number];
    let nextTitle = null as null | typeof sorted[number];
    for (const t of sorted) { if (totalStars >= t.min_stars) currentTitle = t; else { nextTitle = t; break; } }

    const claims = (claimsRes.data ?? []) as { status: string }[];
    const claimCounts = {
      pending:  claims.filter(c => c.status === "pending").length,
      approved: claims.filter(c => c.status === "approved").length,
      rejected: claims.filter(c => c.status === "rejected").length,
    };

    return {
      staff: staffRes.data ? { ...staffRes.data, rank, manager } : null,
      totals: {
        stars: totalStars,
        moons: moonsTotal,
        suns: sunsTotal,
        starsRemainder,
        moonsRemainder,
        starsPerMoon: cfg.stars_per_moon,
        moonsPerSun: cfg.moons_per_sun,
      },
      legacy: { currentTitle, nextTitle, starsToNextTitle: nextTitle ? nextTitle.min_stars - totalStars : 0 },
      evaluation,
      records: recordsRes.data ?? [],
      grades: gradesRes.data ?? [],
      claims: claimCounts,
    };
  });

/** Manager/director: evaluate promotion for every member of the team. */
export const listTeamPromotions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: staff, error } = await context.supabase
      .from("staff").select("id, name, role, role_family, current_rank_key").eq("role_family", "hunter");
    if (error) throw new Error(error.message);
    const evals = await Promise.all(
      (staff ?? []).map(async s => {
        const { data } = await context.supabase.rpc("evaluate_rank", { _staff_id: s.id }).maybeSingle();
        return { staff: s, evaluation: (data ?? null) as RankEvaluation | null };
      }),
    );
    return evals;
  });

/** Manager Dashboard: direct reports for the signed-in manager (or director picks own staff). */
export const getManagerDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = await context.supabase
      .from("staff").select("id, name, role").eq("user_id", context.userId).maybeSingle();
    if (me.error) throw new Error(me.error.message);
    const myStaffId = me.data?.id ?? null;

    const reportsRes = await context.supabase
      .from("staff")
      .select("id, name, role, role_family, current_rank_key, status, location_id, email")
      .eq("manager_id", myStaffId ?? "00000000-0000-0000-0000-000000000000")
      .order("name");
    if (reportsRes.error) throw new Error(reportsRes.error.message);
    const reports = reportsRes.data ?? [];
    const reportIds = reports.map((r: any) => r.id);

    const [claimsRes, gradesRes, locsRes, evalsArr] = await Promise.all([
      reportIds.length
        ? context.supabase.from("achievement_claims")
            .select("id, staff_id, status, created_at, achievement:achievements(name, star_reward)")
            .in("staff_id", reportIds).eq("status", "pending").order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null } as any),
      reportIds.length
        ? context.supabase.from("monthly_evaluations")
            .select("staff_id, month, grade, composite_score")
            .in("staff_id", reportIds).order("month", { ascending: false })
        : Promise.resolve({ data: [], error: null } as any),
      context.supabase.from("locations").select("id, name, code"),
      Promise.all(reports.map(async (r: any) => {
        const { data } = await context.supabase.rpc("evaluate_rank", { _staff_id: r.id }).maybeSingle();
        return { staff_id: r.id, evaluation: data as RankEvaluation | null };
      })),
    ]);
    for (const r of [claimsRes, gradesRes, locsRes] as any[]) if (r.error) throw new Error(r.error.message);

    return {
      me: me.data,
      reports,
      pendingClaims: claimsRes.data ?? [],
      grades: gradesRes.data ?? [],
      locations: locsRes.data ?? [],
      evaluations: evalsArr,
    };
  });

/** Shipbuilder (Director) Dashboard: entire fleet. */
export const getFleetOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [locsRes, staffRes, gradesRes, claimsRes, ranksRes] = await Promise.all([
      context.supabase.from("locations").select("*").order("name"),
      context.supabase.from("staff").select("id, name, role, role_family, manager_id, location_id, current_rank_key, status, email"),
      context.supabase.from("monthly_evaluations").select("staff_id, grade, month, composite_score").order("month", { ascending: false }),
      context.supabase.from("achievement_claims").select("staff_id, status"),
      context.supabase.from("ranks").select("key, name, position").order("position"),
    ]);
    for (const r of [locsRes, staffRes, gradesRes, claimsRes, ranksRes] as any[]) if (r.error) throw new Error(r.error.message);

    const hunters = (staffRes.data ?? []).filter((s: any) => s.role_family === "hunter" && s.status !== "inactive");
    const evaluations = await Promise.all(
      hunters.map(async (s: any) => {
        const { data } = await context.supabase.rpc("evaluate_rank", { _staff_id: s.id }).maybeSingle();
        return { staff_id: s.id, evaluation: data as RankEvaluation | null };
      }),
    );

    return {
      locations: locsRes.data ?? [],
      staff: staffRes.data ?? [],
      grades: gradesRes.data ?? [],
      claims: claimsRes.data ?? [],
      ranks: ranksRes.data ?? [],
      evaluations,
    };
  });
