import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function gradeFor(score: number, rules: { grade: string; min_score: number }[]) {
  const sorted = [...rules].sort((a, b) => b.min_score - a.min_score);
  for (const r of sorted) if (score >= r.min_score) return r.grade as "A" | "B" | "C" | "D";
  return "D" as const;
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
    review_score: number;
    notes?: string;
  }) => d)
  .handler(async ({ context, data }) => {
    const [weights, rules] = await Promise.all([
      context.supabase.from("grade_weights").select("*").eq("id", 1).maybeSingle(),
      context.supabase.from("grade_rules").select("grade, min_score"),
    ]);
    if (weights.error) throw new Error(weights.error.message);
    if (rules.error) throw new Error(rules.error.message);
    const w = weights.data ?? { sales_weight: 60, review_weight: 40 };
    const composite = +(
      (data.sales_score * w.sales_weight) / 100 +
      (data.review_score * w.review_weight) / 100
    ).toFixed(2);
    const grade = gradeFor(composite, rules.data ?? []);

    const { data: row, error } = await context.supabase
      .from("monthly_evaluations")
      .upsert(
        {
          staff_id: data.staff_id,
          month: data.month,
          sales_score: data.sales_score,
          review_score: data.review_score,
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
