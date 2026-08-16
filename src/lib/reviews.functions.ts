import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SubmitReviewInput = {
  staff_id: string;
  month: string; // "YYYY-MM"
  sales_amount: number;
  sales_target: number;
  /** Class Performance, 0-50 */
  class_points: number;
  /** Guild Performance, 0-50 */
  guild_points: number;
  /** Total Performance, 0-100 */
  final_score: number;
  grade: "A" | "B" | "C" | "D";
  // Four frozen behaviour dimensions, each stored as a 0-100 percentage.
  professionalism: number;
  culture: number;
  service_excellence: number;
  teamwork: number;
  notes?: string;
};

function monthToDate(month: string): string {
  // Accepts "YYYY-MM" and returns "YYYY-MM-01".
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) throw new Error(`Invalid month: ${month}`);
  return `${m[1]}-${m[2]}-01`;
}

export const submitMonthlyReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: SubmitReviewInput) => data)
  .handler(async ({ data, context }) => {
    const monthDate = monthToDate(data.month);
    const clamp = (n: number) => Math.max(0, Math.min(100, Number(n) || 0));

    const row = {
      staff_id: data.staff_id,
      month: monthDate,
      // Stored as 0-100 equivalents so existing dashboards keep working.
      sales_score: clamp(data.class_points * 2),
      review_score: clamp(data.guild_points * 2),
      composite_score: Math.max(0, Math.min(999.99, Number(data.final_score) || 0)),
      grade: data.grade,
      notes: data.notes ?? "",
      evaluator_id: context.userId,
      // Behaviour dimensions (percentages).
      discipline_score: clamp(data.professionalism),
      kpi_score: clamp(data.culture),
      achievements_score: clamp(data.service_excellence),
      attendance_score: clamp(data.teamwork),
    };

    const { data: upserted, error } = await context.supabase
      .from("monthly_evaluations")
      .upsert(row, { onConflict: "staff_id,month" })
      .select("id, staff_id, month, grade, composite_score")
      .single();

    if (error) throw new Error(error.message);
    return upserted;
  });

// -------------------------------------------------------------------
// Read side — real Performance data for the Performance dashboard.
// Reads the same monthly_evaluations rows the Ranking system consumes.
// -------------------------------------------------------------------

export type PerformanceBehaviour = { key: string; name: string; percent: number };

export type PerformanceMonthRecord = {
  month: string;          // "YYYY-MM-01"
  label: string;          // "August 2026"
  grade: "A" | "B" | "C" | "D";
  total: number;          // 0-100
  class_points: number;   // 0-50
  guild_points: number;   // 0-50
  behaviours: PerformanceBehaviour[];
  notes: string;
};

export type PerformanceOverview = {
  staff: { id: string; name: string } | null;
  current: PerformanceMonthRecord | null;
  history: PerformanceMonthRecord[]; // newest first, max 12
};

function toRecord(r: {
  month: string;
  grade: string;
  composite_score: number | string;
  sales_score: number | string;
  review_score: number | string;
  discipline_score: number | string;
  kpi_score: number | string;
  achievements_score: number | string;
  attendance_score: number | string;
  notes: string | null;
}): PerformanceMonthRecord {
  const n = (v: number | string | null) => Number(v ?? 0) || 0;
  const d = new Date(`${r.month}T00:00:00Z`);
  return {
    month: r.month,
    label: d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
    grade: (["A", "B", "C", "D"].includes(r.grade) ? r.grade : "D") as "A" | "B" | "C" | "D",
    total: Math.round(n(r.composite_score) * 10) / 10,
    class_points: Math.round((n(r.sales_score) / 2) * 100) / 100,
    guild_points: Math.round((n(r.review_score) / 2) * 100) / 100,
    behaviours: [
      { key: "professionalism", name: "Professionalism", percent: n(r.discipline_score) },
      { key: "culture", name: "Culture", percent: n(r.kpi_score) },
      { key: "service_excellence", name: "Service Excellence", percent: n(r.achievements_score) },
      { key: "teamwork", name: "Teamwork", percent: n(r.attendance_score) },
    ],
    notes: r.notes ?? "",
  };
}

export const getPerformanceOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { staff_id?: string } | undefined) => d ?? {})
  .handler(async ({ context, data }): Promise<PerformanceOverview> => {
    let staffId = data.staff_id ?? "";
    let staffName = "";
    if (!staffId) {
      const me = await context.supabase
        .from("staff")
        .select("id, name")
        .eq("user_id", context.userId)
        .limit(1)
        .maybeSingle();
      staffId = me.data?.id ?? "";
      staffName = me.data?.name ?? "";
    } else {
      const s = await context.supabase
        .from("staff")
        .select("id, name")
        .eq("id", staffId)
        .maybeSingle();
      staffName = s.data?.name ?? "";
    }
    if (!staffId) return { staff: null, current: null, history: [] };

    const { data: rows, error } = await context.supabase
      .from("monthly_evaluations")
      .select(
        "month, grade, composite_score, sales_score, review_score, discipline_score, kpi_score, achievements_score, attendance_score, notes",
      )
      .eq("staff_id", staffId)
      .order("month", { ascending: false })
      .limit(12);

    if (error) throw new Error(error.message);

    const history = (rows ?? []).map((r) => toRecord(r as never));
    return {
      staff: { id: staffId, name: staffName },
      current: history[0] ?? null,
      history,
    };
  });
