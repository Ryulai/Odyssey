import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const CURRENT_SEASON = "S1";

export type SeasonAchievement = {
  id: string;
  code: string | null;
  name: string;
  icon: string;
  ability: string;
  ability_zh: string;
  description: string;
  requirement: string;
  star_reward: number;
  max_per_season: number | null;
  repeat_rule: string;
  approval_required: boolean;
  position: number;
  earned_stars: number;
  earned_count: number;
  pending_claims: number;
  status: "unlocked" | "in_progress" | "locked";
  history: { id: string; period: string; stars: number; awarded_at: string }[];
};

export const getSeasonAchievements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = await context.supabase
      .from("staff")
      .select("id, name")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (me.error) throw new Error(me.error.message);
    const staffId = me.data?.id ?? null;

    const catalogue = await context.supabase
      .from("achievements")
      .select("*")
      .eq("season", CURRENT_SEASON)
      .eq("active", true)
      .order("position");
    if (catalogue.error) throw new Error(catalogue.error.message);

    let records: any[] = [];
    let claims: any[] = [];
    if (staffId) {
      const [r, c] = await Promise.all([
        context.supabase
          .from("achievement_records")
          .select("id, achievement_id, period, stars, awarded_at")
          .eq("staff_id", staffId)
          .order("awarded_at", { ascending: false }),
        context.supabase
          .from("achievement_claims")
          .select("id, achievement_id, status")
          .eq("staff_id", staffId)
          .eq("status", "pending"),
      ]);
      if (r.error) throw new Error(r.error.message);
      if (c.error) throw new Error(c.error.message);
      records = r.data ?? [];
      claims = c.data ?? [];
    }

    const items: SeasonAchievement[] = (catalogue.data ?? []).map((a: any) => {
      const mine = records.filter((r) => r.achievement_id === a.id);
      const earned_stars = mine.reduce((s, r) => s + Number(r.stars ?? 0), 0);
      const pending = claims.filter((c) => c.achievement_id === a.id).length;
      const status: SeasonAchievement["status"] =
        earned_stars > 0 ? "unlocked" : pending > 0 ? "in_progress" : "locked";
      return {
        id: a.id,
        code: a.code,
        name: a.name,
        icon: a.icon ?? "",
        ability: a.ability ?? "",
        ability_zh: a.ability_zh ?? "",
        description: a.description ?? "",
        requirement: a.requirement ?? "",
        star_reward: Number(a.star_reward ?? 1),
        max_per_season: a.max_per_season === null ? null : Number(a.max_per_season),
        repeat_rule: a.repeat_rule ?? "",
        approval_required: Boolean(a.approval_required),
        position: Number(a.position ?? 0),
        earned_stars,
        earned_count: mine.length,
        pending_claims: pending,
        status,
        history: mine.map((r) => ({
          id: r.id,
          period: r.period ?? "",
          stars: Number(r.stars ?? 0),
          awarded_at: r.awarded_at,
        })),
      };
    });

    return {
      season: CURRENT_SEASON,
      staff: me.data ?? null,
      items,
      total_stars: items.reduce((s, i) => s + i.earned_stars, 0),
      unlocked: items.filter((i) => i.status === "unlocked").length,
    };
  });
