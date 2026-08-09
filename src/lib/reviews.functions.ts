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
