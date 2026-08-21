import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// -------------------------------------------------------------------
// Leaderboard — presentation/competition layer only.
// Reads the SAME real data the Performance System (monthly_evaluations)
// and Ranking System (staff.current_rank_key + ranks) already use.
// It never computes new scores, never invents rank criteria, and never
// exposes private manager notes / review comments.
// -------------------------------------------------------------------

/** Next ranks whose criteria are confirmed today (mirrors the Promotion Engine). */
const DEFINED_NEXT_RANKS = new Set(["apprentice", "bronze", "silver", "gold"]);

export type LeaderboardRow = {
  staff_id: string;
  name: string;
  class_key: string | null;
  rank_key: string | null;
  location_name: string | null;
  /** Latest completed Performance record, or null when the Hunter has none. */
  score: number | null;
  grade: "A" | "B" | "C" | "D" | null;
  month: string | null;
  class_score: number | null; // Class (Sales) Performance, 0-50
  guild_score: number | null; // Guild (Behaviour) Performance, 0-50
  next_rank_key: string | null;
  next_rank_name: string | null;
  /** 0-100, or null when the next rank's criteria are not yet defined. */
  promotion_percent: number | null;
  is_me: boolean;
};

export type LeaderboardPayload = {
  rows: LeaderboardRow[];
  me_staff_id: string | null;
  my_position: number | null;
  notice?: string;
};

export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LeaderboardPayload> => {
    const meRes = await context.supabase
      .from("staff")
      .select("id")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (meRes.error) throw new Error(meRes.error.message);
    const meStaffId = meRes.data?.id ?? null;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const staffRes = await supabaseAdmin
      .from("staff")
      .select("id, name, current_rank_key, location_id, career_path")
      .neq("status", "inactive");
    if (staffRes.error) throw new Error(staffRes.error.message);
    const staff = staffRes.data ?? [];

    if (!staff.length) {
      return { rows: [], me_staff_id: meStaffId, my_position: null, notice: "No Hunters on the manifest yet." };
    }

    const ids = staff.map(s => s.id);

    const [evalsRes, locRes, ranksRes, identRes, rpgRes, achRes] = await Promise.all([
      // NOTE: `notes` is deliberately NOT selected — private manager notes never leave the server.
      supabaseAdmin
        .from("monthly_evaluations")
        .select("staff_id, month, composite_score, grade, sales_score, review_score")
        .in("staff_id", ids)
        .order("month", { ascending: false }),
      supabaseAdmin.from("locations").select("id, name"),
      supabaseAdmin.from("ranks").select("key, name, position, min_total_stars").order("position", { ascending: true }),
      supabaseAdmin.from("staff_identities").select("staff_id, class_key, is_primary").in("staff_id", ids),
      supabaseAdmin.from("rpg_identity").select("staff_id, primary_class").in("staff_id", ids),
      supabaseAdmin.from("achievement_records").select("staff_id, stars").in("staff_id", ids),
    ]);
    for (const r of [evalsRes, locRes, ranksRes, identRes, rpgRes, achRes] as Array<{ error: unknown }>) {
      if (r.error) throw new Error((r.error as { message: string }).message);
    }

    const latest = new Map<string, { month: string; composite_score: number | null; grade: string | null; sales_score: number | null; review_score: number | null }>();
    for (const e of evalsRes.data ?? []) if (!latest.has(e.staff_id)) latest.set(e.staff_id, e as never);

    const locMap = new Map((locRes.data ?? []).map(l => [l.id, l.name]));

    const ranks = ranksRes.data ?? [];
    const rankByKey = new Map(ranks.map(r => [r.key, r]));

    const classMap = new Map<string, string>();
    for (const i of rpgRes.data ?? []) if (i.primary_class) classMap.set(i.staff_id, i.primary_class);
    for (const i of identRes.data ?? []) if (i.is_primary && i.class_key) classMap.set(i.staff_id, i.class_key);

    const starMap = new Map<string, number>();
    for (const a of achRes.data ?? []) starMap.set(a.staff_id, (starMap.get(a.staff_id) ?? 0) + (Number(a.stars) || 0));

    const rows: LeaderboardRow[] = staff.map(s => {
      const e = latest.get(s.id);
      const current = s.current_rank_key ? rankByKey.get(s.current_rank_key) : undefined;
      const next = current
        ? ranks.find(r => r.position === current.position + 1)
        : ranks[0];

      let promotion_percent: number | null = null;
      if (next && DEFINED_NEXT_RANKS.has(next.key)) {
        const need = Number(next.min_total_stars) || 0;
        const have = starMap.get(s.id) ?? 0;
        promotion_percent = need > 0 ? Math.min(100, Math.round((have / need) * 100)) : 0;
      }

      return {
        staff_id: s.id,
        name: s.name,
        class_key: classMap.get(s.id) ?? s.career_path ?? null,
        rank_key: s.current_rank_key,
        location_name: s.location_id ? locMap.get(s.location_id) ?? null : null,
        score: e ? Number(e.composite_score) : null,
        grade: (e?.grade as LeaderboardRow["grade"]) ?? null,
        month: e?.month ?? null,
        class_score: e ? Number(e.sales_score) / 2 : null,
        guild_score: e ? Number(e.review_score) / 2 : null,
        next_rank_key: next?.key ?? null,
        next_rank_name: next?.name ?? null,
        promotion_percent,
        is_me: !!meStaffId && s.id === meStaffId,
      };
    });

    // Scored Hunters first (highest score wins); unscored Hunters after, alphabetical.
    rows.sort((a, b) => {
      if (a.score === null && b.score === null) return a.name.localeCompare(b.name);
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return b.score - a.score;
    });

    const idx = rows.findIndex(r => r.is_me);
    return {
      rows,
      me_staff_id: meStaffId,
      my_position: idx >= 0 ? idx + 1 : null,
      notice: meStaffId ? undefined : "You aren't on the crew manifest yet — ask a Director to add you to appear on the board.",
    };
  });
