import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SubmitReviewInput = {
  staff_id: string;
  month: string; // "YYYY-MM"
  sales_amount: number;
  sales_target: number;
  sales_score: number;
  behaviour_score: number;
  final_score: number;
  grade: "A" | "B" | "C" | "D";
  // Behaviour sub-scores mapped to leaderboard A/B/C/D breakdown.
  behaviour_a: number; // -> discipline_score (Behaviour)
  behaviour_b: number; // -> kpi_score (Direction)
  behaviour_c: number; // -> achievements_score (Contribution)
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
      sales_score: clamp(data.sales_score),
      review_score: clamp(data.behaviour_score),
      composite_score: Math.max(0, Math.min(999.99, Number(data.final_score) || 0)),
      grade: data.grade,
      notes: data.notes ?? "",
      evaluator_id: context.userId,
      attendance_score: clamp(data.behaviour_a),
      discipline_score: clamp(data.behaviour_a),
      kpi_score: clamp(data.behaviour_b),
      achievements_score: clamp(data.behaviour_c),
    };

    const { data: upserted, error } = await context.supabase
      .from("monthly_evaluations")
      .upsert(row, { onConflict: "staff_id,month" })
      .select("id, staff_id, month, grade, composite_score")
      .single();

    if (error) throw new Error(error.message);
    return upserted;
  });
