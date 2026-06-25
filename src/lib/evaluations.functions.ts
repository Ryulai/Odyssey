import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Six-factor Grade Engine.
 *  Composite = Σ (factor_score × weight) / Σ weights, capped 0..100.
 *  Grade letter is then looked up from grade_rules thresholds. */
export const FACTOR_KEYS = [
  "sales", "attendance", "achievements", "review", "discipline", "kpi",
] as const;
export type FactorKey = typeof FACTOR_KEYS[number];

function gradeFor(score: number, rules: { grade: string; min_score: number }[]) {
  const sorted = [...rules].sort((a, b) => b.min_score - a.min_score);
  for (const r of sorted) if (score >= r.min_score) return r.grade as "A" | "B" | "C" | "D";
  return "D" as const;
}

export function computeComposite(
  scores: Record<FactorKey, number>,
  w: Record<`${FactorKey}_w`, number>,
) {
  const pairs: [number, number][] = [
    [scores.sales, w.sales_w],
    [scores.attendance, w.attendance_w],
    [scores.achievements, w.achievements_w],
    [scores.review, w.review_w],
    [scores.discipline, w.discipline_w],
    [scores.kpi, w.kpi_w],
  ];
  const total = pairs.reduce((a, [, wt]) => a + (wt || 0), 0) || 1;
  const sum = pairs.reduce((a, [s, wt]) => a + Math.max(0, Math.min(100, s)) * (wt || 0), 0);
  return +(sum / total).toFixed(2);
}

export const listEvaluations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("monthly_evaluations")
      .select("*, staff:staff(name, role)")
      .order("month", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const submitEvaluation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    staff_id: string;
    month: string; // YYYY-MM-01
    sales_score: number;
    attendance_score: number;
    achievements_score: number;
    review_score: number;
    discipline_score: number;
    kpi_score: number;
    notes?: string;
  }) => d)
  .handler(async ({ context, data }) => {
    const [weights, rules] = await Promise.all([
      context.supabase.from("grade_weights").select("*").eq("id", 1).maybeSingle(),
      context.supabase.from("grade_rules").select("grade, min_score"),
    ]);
    if (weights.error) throw new Error(weights.error.message);
    if (rules.error) throw new Error(rules.error.message);
    const w = {
      sales_w: weights.data?.sales_w ?? 30,
      attendance_w: weights.data?.attendance_w ?? 15,
      achievements_w: weights.data?.achievements_w ?? 15,
      review_w: weights.data?.review_w ?? 15,
      discipline_w: weights.data?.discipline_w ?? 10,
      kpi_w: weights.data?.kpi_w ?? 15,
    };
    const composite = computeComposite({
      sales: data.sales_score,
      attendance: data.attendance_score,
      achievements: data.achievements_score,
      review: data.review_score,
      discipline: data.discipline_score,
      kpi: data.kpi_score,
    }, w);
    const grade = gradeFor(composite, rules.data ?? []);

    const { data: row, error } = await context.supabase
      .from("monthly_evaluations")
      .upsert(
        {
          staff_id: data.staff_id,
          month: data.month,
          sales_score: data.sales_score,
          attendance_score: data.attendance_score,
          achievements_score: data.achievements_score,
          review_score: data.review_score,
          discipline_score: data.discipline_score,
          kpi_score: data.kpi_score,
          composite_score: composite,
          grade,
          notes: data.notes ?? "",
          evaluator_id: context.userId,
        },
        { onConflict: "staff_id,month" },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteEvaluation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("monthly_evaluations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
