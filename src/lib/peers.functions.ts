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

export type PeerInsightsPayload = {
  me: { staff_id: string; name: string; rank_key: string | null; location_id: string | null; location_name: string | null } | null;
  month: string; // YYYY-MM
  peers: PeerRow[];
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
    // Resolve current user's staff row (fleet + rank).
    const meRes = await context.supabase
      .from("staff")
      .select("id, name, current_rank_key, location_id, role_family")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (meRes.error) throw new Error(meRes.error.message);
    const meStaff = meRes.data;
    if (!meStaff) {
      return { me: null, month: monthStart(), peers: [], notice: "You aren't on the crew manifest yet — Peer Insights unlocks once a Director adds you." };
    }

    // Same-fleet + same-rank scope. Use admin client to read peer summaries
    // (RLS blocks cross-user reads); we deliberately project only non-sensitive fields.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [peersRes, locRes] = await Promise.all([
      meStaff.location_id && meStaff.current_rank_key
        ? supabaseAdmin
            .from("staff")
            .select("id, name, current_rank_key, location_id")
            .eq("location_id", meStaff.location_id)
            .eq("current_rank_key", meStaff.current_rank_key)
            .neq("status", "inactive")
        : Promise.resolve({ data: [], error: null } as any),
      meStaff.location_id
        ? supabaseAdmin.from("locations").select("id, name").eq("id", meStaff.location_id).maybeSingle()
        : Promise.resolve({ data: null, error: null } as any),
    ]);
    if ((peersRes as any).error) throw new Error((peersRes as any).error.message);
    if ((locRes as any).error) throw new Error((locRes as any).error.message);

    const peerStaff = (peersRes.data ?? []) as Array<{ id: string; name: string; current_rank_key: string | null; location_id: string | null }>;
    const peerIds = peerStaff.map(p => p.id);
    const currentMonth = monthStart();
    const previousMonth = prevMonthStart();
    const locationName = (locRes as any).data?.name ?? null;

    if (!peerIds.length) {
      return {
        me: { staff_id: meStaff.id, name: meStaff.name, rank_key: meStaff.current_rank_key, location_id: meStaff.location_id, location_name: locationName },
        month: currentMonth,
        peers: [],
        notice: "No peers of your rank in your fleet this month.",
      };
    }

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
        location_name: locationName,
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
        is_me: p.id === meStaff.id,
      };
    });

    peers.sort((x, y) => y.overall - x.overall);

    return {
      me: { staff_id: meStaff.id, name: meStaff.name, rank_key: meStaff.current_rank_key, location_id: meStaff.location_id, location_name: locationName },
      month: currentMonth,
      peers,
    };
  });
