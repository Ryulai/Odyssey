import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Objective Performance Engine — pluggable per Primary Class.
 * Prototype V1 implements only the "Hunter → Sales" resolver.
 */
export type ObjectiveType = "sales" | "output" | "audit" | "kpi";

export const OBJECTIVE_BY_CLASS: Record<string, ObjectiveType> = {
  ranger: "sales",     // Hunter is Ranger + hunter role
  warrior: "output",
  mage: "output",
  guardian: "audit",
  // Future: navigator → "kpi"
};

export const OBJECTIVE_META: Record<ObjectiveType, {
  label: string;
  unit: "currency" | "count" | "percent";
  currency?: string;
  defaultTarget: number;
  implemented: boolean;
}> = {
  sales:  { label: "Sales",              unit: "currency", currency: "MYR", defaultTarget: 50000, implemented: true  },
  output: { label: "Performance Output", unit: "count",                     defaultTarget: 0,     implemented: false },
  audit:  { label: "SOP Audit",          unit: "percent",                    defaultTarget: 100,   implemented: false },
  kpi:    { label: "Project KPI",        unit: "percent",                    defaultTarget: 100,   implemented: false },
};

export type ObjectiveHistoryEntry = {
  id: string;
  sales_date: string;
  amount: number;
  reviewed_at: string | null;
  reviewer_name: string | null;
  running_total: number;
};

export type ObjectivePerformance = {
  month: string;              // YYYY-MM
  objective_type: ObjectiveType;
  objective_label: string;
  unit: "currency" | "count" | "percent";
  currency: string | null;
  target: number;
  approved_total: number;
  progress_pct: number;       // 0..100+, rounded 1dp
  implemented: boolean;
  primary_class: string | null;
  primary_role: string | null;
  staff: { id: string; name: string } | null;
  history: ObjectiveHistoryEntry[];
};

function monthKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
function monthBounds(month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { start, end: nextMonth };
}

/** Get the current user's Objective Performance for a given month (default: current). */
export const getMyObjectivePerformance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { month?: string } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    const month = data?.month && /^\d{4}-\d{2}$/.test(data.month) ? data.month : monthKey();

    // Resolve staff + primary class.
    const staffRes = await context.supabase
      .from("staff")
      .select("id, name, rpg:rpg_identity(primary_class, primary_role)")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (staffRes.error) throw new Error(staffRes.error.message);
    const staff = staffRes.data as any;

    const primaryClass = staff?.rpg?.primary_class ?? null;
    const primaryRole = staff?.rpg?.primary_role ?? null;
    const objectiveType: ObjectiveType = OBJECTIVE_BY_CLASS[primaryClass ?? ""] ?? "sales";
    const meta = OBJECTIVE_META[objectiveType];

    const emptyResult: ObjectivePerformance = {
      month,
      objective_type: objectiveType,
      objective_label: meta.label,
      unit: meta.unit,
      currency: meta.currency ?? null,
      target: meta.defaultTarget,
      approved_total: 0,
      progress_pct: 0,
      implemented: meta.implemented,
      primary_class: primaryClass,
      primary_role: primaryRole,
      staff: staff ? { id: staff.id, name: staff.name } : null,
      history: [],
    };
    if (!staff?.id) return emptyResult;

    // Target row (or default).
    const tgtRes = await context.supabase
      .from("objective_targets")
      .select("target_amount")
      .eq("staff_id", staff.id)
      .eq("month", month)
      .eq("objective_type", objectiveType)
      .maybeSingle();
    if (tgtRes.error) throw new Error(tgtRes.error.message);
    const target = Number(tgtRes.data?.target_amount ?? meta.defaultTarget);

    // Only implemented objective type (Hunter → Sales) aggregates approved claims.
    if (!meta.implemented || objectiveType !== "sales") {
      return { ...emptyResult, target };
    }

    const { start, end } = monthBounds(month);
    const rowsRes = await context.supabase
      .from("daily_sales_claims")
      .select("id, sales_date, total_amount, reviewed_at, reviewed_by")
      .eq("staff_id", staff.id)
      .eq("status", "approved")
      .gte("sales_date", start)
      .lt("sales_date", end)
      .order("sales_date", { ascending: true })
      .order("reviewed_at", { ascending: true, nullsFirst: true });
    if (rowsRes.error) throw new Error(rowsRes.error.message);

    const rows = (rowsRes.data ?? []) as Array<{
      id: string; sales_date: string; total_amount: number;
      reviewed_at: string | null; reviewed_by: string | null;
    }>;

    // Reviewer names.
    const reviewerIds = Array.from(new Set(rows.map(r => r.reviewed_by).filter(Boolean))) as string[];
    let reviewerMap: Record<string, string> = {};
    if (reviewerIds.length) {
      const p = await context.supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", reviewerIds);
      if (p.error) throw new Error(p.error.message);
      reviewerMap = Object.fromEntries((p.data ?? []).map((r: any) => [r.id, r.full_name || r.email || "Reviewer"]));
    }

    let running = 0;
    const history: ObjectiveHistoryEntry[] = rows.map(r => {
      const amt = Number(r.total_amount);
      running += amt;
      return {
        id: r.id,
        sales_date: r.sales_date,
        amount: amt,
        reviewed_at: r.reviewed_at,
        reviewer_name: r.reviewed_by ? reviewerMap[r.reviewed_by] ?? null : null,
        running_total: Math.round(running * 100) / 100,
      };
    });

    const approved_total = Math.round(running * 100) / 100;
    const progress_pct = target > 0 ? Math.round((approved_total / target) * 1000) / 10 : 0;

    return {
      ...emptyResult,
      target,
      approved_total,
      progress_pct,
      history,
    };
  });

/** Set/update the current user's monthly objective target. */
export const setMyObjectiveTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { month?: string; objective_type?: ObjectiveType; target_amount: number }) => d)
  .handler(async ({ context, data }) => {
    const month = data.month && /^\d{4}-\d{2}$/.test(data.month) ? data.month : monthKey();
    const objectiveType: ObjectiveType = data.objective_type ?? "sales";
    if (!Number.isFinite(data.target_amount) || data.target_amount < 0) {
      throw new Error("Invalid target amount.");
    }

    const staffRes = await context.supabase
      .from("staff").select("id").eq("user_id", context.userId)
      .order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (staffRes.error) throw new Error(staffRes.error.message);
    if (!staffRes.data?.id) throw new Error("No staff profile linked.");

    const { data: row, error } = await context.supabase
      .from("objective_targets")
      .upsert(
        {
          staff_id: staffRes.data.id,
          month,
          objective_type: objectiveType,
          target_amount: data.target_amount,
        },
        { onConflict: "staff_id,month,objective_type" },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
