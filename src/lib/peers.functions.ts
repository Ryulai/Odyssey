import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PeerRow = {
  staff_id: string;
  name: string;
  rank_key: string | null;
  location_id: string | null;
  location_name: string | null;
  overall: number;
  grade: string | null;
  a_behaviour: number;
  b_direction: number;
  c_contribution: number;
  d_result: number;
  prev_overall: number | null;
  trend: "up" | "down" | "flat" | "new";
  top_strength: "A" | "B" | "C" | "D" | null;
  achievements_count: number;
  is_me: boolean;
};

export type PeerScope =
  | { kind: "hunter"; label: string }
  | { kind: "direct_reports"; label: string }
  | { kind: "department"; label: string }
  | { kind: "organization"; label: string };

export type PeerInsightsPayload = {
  me: { staff_id: string; name: string; rank_key: string | null; location_id: string | null; location_name: string | null; role: "director" | "manager" | "staff" } | null;
  month: string;
  peers: PeerRow[];
  scope: PeerScope;
  notice?: string;
};

function monthStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}
function prevMonthStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).toISOString().slice(0, 10);
}

export const getPeerInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PeerInsightsPayload> => {
    // Resolve caller role from user_roles (highest privilege wins).
    const rolesRes = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (rolesRes.error) throw new Error(rolesRes.error.message);
    const roleSet = new Set((rolesRes.data ?? []).map(r => r.role as string));
    const callerRole: "director" | "manager" | "staff" = roleSet.has("director")
      ? "director"
      : roleSet.has("manager")
        ? "manager"
        : "staff";

    // Resolve caller's own staff row.
    const meRes = await context.supabase
      .from("staff")
      .select("id, name, current_rank_key, location_id, business_unit")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (meRes.error) throw new Error(meRes.error.message);
    const meStaff = meRes.data;

    const currentMonth = monthStart();
    const previousMonth = prevMonthStart();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Determine scope + peer query based on role.
    let peerQuery: any;
    let scope: PeerScope;

    if (callerRole === "director") {
      scope = { kind: "organization", label: "Entire organization" };
      peerQuery = supabaseAdmin
        .from("staff")
        .select("id, name, current_rank_key, location_id, business_unit, manager_id")
        .neq("status", "inactive");
    } else if (callerRole === "manager") {
      if (!meStaff) {
        return {
          me: null,
          month: currentMonth,
          peers: [],
          scope: { kind: "direct_reports", label: "Your team" },
          notice: "You aren't linked to a staff record yet — ask a Director to add you.",
        };
      }
      // Department manager: has a business_unit → see everyone in it.
      // Direct manager: no business_unit → see direct reports only.
      if (meStaff.business_unit) {
        scope = { kind: "department", label: `Department · ${meStaff.business_unit}` };
        peerQuery = supabaseAdmin
          .from("staff")
          .select("id, name, current_rank_key, location_id, business_unit, manager_id")
          .eq("business_unit", meStaff.business_unit)
          .neq("status", "inactive");
      } else {
        scope = { kind: "direct_reports", label: "Your direct reports" };
        peerQuery = supabaseAdmin
          .from("staff")
          .select("id, name, current_rank_key, location_id, business_unit, manager_id")
          .eq("manager_id", meStaff.id)
          .neq("status", "inactive");
      }
    } else {
      // Hunter: same fleet + same rank only.
      if (!meStaff) {
        return {
          me: null,
          month: currentMonth,
          peers: [],
          scope: { kind: "hunter", label: "Same fleet · same rank" },
          notice: "You aren't on the crew manifest yet — Peer Insights unlocks once a Director adds you.",
        };
      }
      scope = { kind: "hunter", label: "Same fleet · same rank" };
      if (!meStaff.location_id || !meStaff.current_rank_key) {
        return {
          me: { staff_id: meStaff.id, name: meStaff.name, rank_key: meStaff.current_rank_key, location_id: meStaff.location_id, location_name: null, role: callerRole },
          month: currentMonth,
          peers: [],
          scope,
          notice: "Your fleet or rank isn't set yet — ask a Director to complete your profile.",
        };
      }
      peerQuery = supabaseAdmin
        .from("staff")
        .select("id, name, current_rank_key, location_id, business_unit, manager_id")
        .eq("location_id", meStaff.location_id)
        .eq("current_rank_key", meStaff.current_rank_key)
        .neq("status", "inactive");
    }

    const peersRes = await peerQuery;
    if (peersRes.error) throw new Error(peersRes.error.message);
    const peerStaff = (peersRes.data ?? []) as Array<{ id: string; name: string; current_rank_key: string | null; location_id: string | null; business_unit: string | null; manager_id: string | null }>;

    // Location names for display.
    const locationIds = Array.from(new Set(peerStaff.map(p => p.location_id).filter(Boolean))) as string[];
    const locRes = locationIds.length
      ? await supabaseAdmin.from("locations").select("id, name").in("id", locationIds)
      : { data: [], error: null } as any;
    if ((locRes as any).error) throw new Error((locRes as any).error.message);
    const locMap = new Map<string, string>();
    for (const l of (locRes as any).data ?? []) locMap.set(l.id, l.name);

    const myLocationName = meStaff?.location_id ? locMap.get(meStaff.location_id) ?? null : null;

    if (!peerStaff.length) {
      return {
        me: meStaff ? { staff_id: meStaff.id, name: meStaff.name, rank_key: meStaff.current_rank_key, location_id: meStaff.location_id, location_name: myLocationName, role: callerRole } : null,
        month: currentMonth,
        peers: [],
        scope,
        notice: callerRole === "staff"
          ? "No peers of your rank in your fleet this month."
          : "No Hunters in your scope yet.",
      };
    }

    const peerIds = peerStaff.map(p => p.id);
    const [evalsRes, prevEvalsRes, achRes] = await Promise.all([
      supabaseAdmin
        .from("monthly_evaluations")
        .select("staff_id, composite_score, grade, discipline_score, kpi_score, achievements_score, sales_score, attendance_score, review_score")
        .in("staff_id", peerIds)
        .eq("month", currentMonth),
      supabaseAdmin
        .from("monthly_evaluations")
        .select("staff_id, composite_score")
        .in("staff_id", peerIds)
        .eq("month", previousMonth),
      supabaseAdmin
        .from("achievement_records")
        .select("staff_id")
        .in("staff_id", peerIds),
    ]);
    for (const r of [evalsRes, prevEvalsRes, achRes] as any[]) if (r.error) throw new Error(r.error.message);

    const evalMap = new Map<string, any>();
    for (const e of evalsRes.data ?? []) evalMap.set(e.staff_id, e);
    const prevMap = new Map<string, number>();
    for (const e of prevEvalsRes.data ?? []) prevMap.set(e.staff_id, Number(e.composite_score) || 0);
    const achMap = new Map<string, number>();
    for (const a of achRes.data ?? []) achMap.set(a.staff_id, (achMap.get(a.staff_id) ?? 0) + 1);

    const peers: PeerRow[] = peerStaff.map(p => {
      const e = evalMap.get(p.id);
      const a = Number(e?.discipline_score ?? e?.attendance_score ?? 0);
      const b = Number(e?.kpi_score ?? e?.review_score ?? 0);
      const c = Number(e?.achievements_score ?? 0);
      const d = Number(e?.sales_score ?? 0);
      const overall = Number(e?.composite_score ?? 0);
      const prev = prevMap.get(p.id) ?? null;
      const trend: PeerRow["trend"] = !e
        ? "new"
        : prev === null
          ? "flat"
          : overall > prev + 0.5
            ? "up"
            : overall < prev - 0.5
              ? "down"
              : "flat";
      const cats: Array<[PeerRow["top_strength"], number]> = [["A", a], ["B", b], ["C", c], ["D", d]];
      const strong = cats.reduce((best, cur) => (cur[1] > (best?.[1] ?? -1) ? cur : best), null as any);
      return {
        staff_id: p.id,
        name: p.name,
        rank_key: p.current_rank_key,
        location_id: p.location_id,
        location_name: p.location_id ? locMap.get(p.location_id) ?? null : null,
        overall,
        grade: e?.grade ?? null,
        a_behaviour: a,
        b_direction: b,
        c_contribution: c,
        d_result: d,
        prev_overall: prev,
        trend,
        top_strength: e ? (strong?.[0] ?? null) : null,
        achievements_count: achMap.get(p.id) ?? 0,
        is_me: !!meStaff && p.id === meStaff.id,
      };
    });

    peers.sort((x, y) => y.overall - x.overall);

    return {
      me: meStaff ? { staff_id: meStaff.id, name: meStaff.name, rank_key: meStaff.current_rank_key, location_id: meStaff.location_id, location_name: myLocationName, role: callerRole } : null,
      month: currentMonth,
      peers,
      scope,
    };
  });
