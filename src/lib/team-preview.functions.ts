import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Manager self-preview access.
 *
 * Access is derived from the ORGANISATIONAL REPORTING STRUCTURE
 * (staff.manager_id), never from a hardcoded list of titles.
 * Anyone with at least one direct report may PREVIEW that report's
 * Performance Review and Achievement information. Directors keep their
 * existing organisation-wide access. Nothing here grants edit rights.
 */

export type DirectReport = {
  staff_id: string;
  name: string;
  email: string | null;
  role: string;
  status: string;
  current_rank_key: string | null;
  latest_grade: string | null;
  latest_month: string | null;
  latest_total: number | null;
  pending_claims: number;
  total_stars: number;
};

export type TeamScope = {
  me: { staff_id: string | null; name: string | null } | null;
  is_director: boolean;
  has_direct_reports: boolean;
  reports: DirectReport[];
};

async function loadScope(supabase: any, userId: string) {
  const [mineRes, rolesRes] = await Promise.all([
    supabase.from("staff").select("id, name").eq("user_id", userId),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  if (mineRes.error) throw new Error(mineRes.error.message);
  const mine = (mineRes.data ?? []) as { id: string; name: string }[];
  const isDirector = (rolesRes.data ?? []).some((r: any) => r.role === "director");
  const myStaffIds = mine.map((s) => s.id);

  let reportIds: string[] = [];
  let reports: any[] = [];
  if (myStaffIds.length) {
    const r = await supabase
      .from("staff")
      .select("id, name, email, role, status, current_rank_key")
      .in("manager_id", myStaffIds)
      .order("name");
    if (r.error) throw new Error(r.error.message);
    reports = r.data ?? [];
    reportIds = reports.map((x: any) => x.id);
  }
  return { mine, isDirector, myStaffIds, reports, reportIds };
}

/** Direct reports of the signed-in user, with a light preview summary. */
export const getMyTeamScope = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TeamScope> => {
    const { mine, isDirector, reports, reportIds } = await loadScope(context.supabase, context.userId);

    let evals: any[] = [];
    let claims: any[] = [];
    let records: any[] = [];
    if (reportIds.length) {
      const [e, c, rec] = await Promise.all([
        context.supabase
          .from("monthly_evaluations")
          .select("staff_id, month, grade, composite_score")
          .in("staff_id", reportIds)
          .order("month", { ascending: false }),
        context.supabase
          .from("achievement_claims")
          .select("staff_id, status")
          .in("staff_id", reportIds)
          .eq("status", "pending"),
        context.supabase
          .from("achievement_records")
          .select("staff_id, stars")
          .in("staff_id", reportIds),
      ]);
      for (const r of [e, c, rec] as any[]) if (r.error) throw new Error(r.error.message);
      evals = e.data ?? [];
      claims = c.data ?? [];
      records = rec.data ?? [];
    }

    const list: DirectReport[] = reports.map((s: any) => {
      const latest = evals.find((x) => x.staff_id === s.id) ?? null;
      return {
        staff_id: s.id,
        name: s.name,
        email: s.email ?? null,
        role: s.role ?? "",
        status: s.status ?? "active",
        current_rank_key: s.current_rank_key ?? null,
        latest_grade: latest?.grade ?? null,
        latest_month: latest?.month ?? null,
        latest_total: latest ? Number(latest.composite_score ?? 0) : null,
        pending_claims: claims.filter((c) => c.staff_id === s.id).length,
        total_stars: records
          .filter((r) => r.staff_id === s.id)
          .reduce((sum, r) => sum + Number(r.stars ?? 0), 0),
      };
    });

    return {
      me: mine[0] ? { staff_id: mine[0].id, name: mine[0].name } : null,
      is_director: isDirector,
      has_direct_reports: list.length > 0,
      reports: list,
    };
  });

export type ReportPreview = {
  staff: { id: string; name: string; role: string; current_rank_key: string | null };
  performance: {
    month: string;
    label: string;
    grade: string;
    total: number;
    class_points: number;
    guild_points: number;
    behaviours: { key: string; name: string; percent: number }[];
  }[];
  achievements: {
    id: string;
    name: string;
    icon: string;
    stars: number;
    count: number;
    pending: number;
  }[];
  total_stars: number;
};

/**
 * Preview one employee's Performance Review + Achievement information.
 * Server-side authorisation: the target MUST be a direct report of the
 * caller, unless the caller is a Director (existing authority preserved).
 */
export const getReportPreview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { staff_id: string }) => d)
  .handler(async ({ context, data }): Promise<ReportPreview> => {
    const { isDirector, reportIds } = await loadScope(context.supabase, context.userId);
    if (!isDirector && !reportIds.includes(data.staff_id)) {
      throw new Error("Not authorised: this employee does not report to you.");
    }

    const staffRes = await context.supabase
      .from("staff")
      .select("id, name, role, current_rank_key")
      .eq("id", data.staff_id)
      .maybeSingle();
    if (staffRes.error) throw new Error(staffRes.error.message);
    if (!staffRes.data) throw new Error("Employee not found.");

    const [evalRes, recRes, claimRes, catRes] = await Promise.all([
      context.supabase
        .from("monthly_evaluations")
        .select(
          "month, grade, composite_score, sales_score, review_score, discipline_score, kpi_score, achievements_score, attendance_score",
        )
        .eq("staff_id", data.staff_id)
        .order("month", { ascending: false })
        .limit(12),
      context.supabase
        .from("achievement_records")
        .select("achievement_id, stars")
        .eq("staff_id", data.staff_id),
      context.supabase
        .from("achievement_claims")
        .select("achievement_id, status")
        .eq("staff_id", data.staff_id)
        .eq("status", "pending"),
      context.supabase
        .from("achievements")
        .select("id, name, icon, position")
        .eq("active", true)
        .order("position"),
    ]);
    for (const r of [evalRes, recRes, claimRes, catRes] as any[]) if (r.error) throw new Error(r.error.message);

    const n = (v: any) => Number(v ?? 0) || 0;
    const performance = (evalRes.data ?? []).map((r: any) => ({
      month: r.month,
      label: new Date(`${r.month}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      grade: r.grade,
      total: Math.round(n(r.composite_score) * 10) / 10,
      class_points: Math.round((n(r.sales_score) / 2) * 100) / 100,
      guild_points: Math.round((n(r.review_score) / 2) * 100) / 100,
      behaviours: [
        { key: "professionalism", name: "Professionalism", percent: n(r.discipline_score) },
        { key: "culture", name: "Culture", percent: n(r.kpi_score) },
        { key: "service_excellence", name: "Service Excellence", percent: n(r.achievements_score) },
        { key: "teamwork", name: "Teamwork", percent: n(r.attendance_score) },
      ],
    }));

    const records = recRes.data ?? [];
    const claims = claimRes.data ?? [];
    const achievements = (catRes.data ?? []).map((a: any) => {
      const mine = records.filter((r: any) => r.achievement_id === a.id);
      return {
        id: a.id,
        name: a.name,
        icon: a.icon ?? "",
        stars: mine.reduce((s: number, r: any) => s + n(r.stars), 0),
        count: mine.length,
        pending: claims.filter((c: any) => c.achievement_id === a.id).length,
      };
    });

    return {
      staff: staffRes.data as ReportPreview["staff"],
      performance,
      achievements,
      total_stars: records.reduce((s: number, r: any) => s + n(r.stars), 0),
    };
  });
