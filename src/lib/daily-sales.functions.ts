import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DailySalesClaim = {
  id: string;
  staff_id: string;
  submitted_by: string;
  sales_date: string;
  total_amount: number;
  evidence_files: string[];
  remarks: string;
  status: string;
  created_at: string;
};

/** List the current user's own daily sales claim history, newest first. */
export const listMyDailySales = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("daily_sales_claims")
      .select("*")
      .eq("submitted_by", context.userId)
      .order("sales_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as DailySalesClaim[];
  });

/** Submit a new Daily Sales Claim. Only hunters (staff.role_family='hunter') can submit. */
export const submitDailySales = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    sales_date: string;      // YYYY-MM-DD
    total_amount: number;
    evidence_files: string[]; // storage paths in daily-sales-evidence bucket
    remarks: string;
  }) => d)
  .handler(async ({ context, data }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.sales_date)) throw new Error("Invalid date.");
    if (!Number.isFinite(data.total_amount) || data.total_amount < 0) throw new Error("Invalid sales amount.");

    // Resolve caller's staff row and enforce hunter role.
    const staffRes = await context.supabase
      .from("staff")
      .select("id, role_family")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (staffRes.error) throw new Error(staffRes.error.message);
    const staff = staffRes.data;
    if (!staff?.id) throw new Error("No staff profile linked to this account.");
    if (staff.role_family !== "hunter") throw new Error("Only Hunter accounts may submit Daily Sales.");

    const files = (data.evidence_files ?? []).filter(Boolean).slice(0, 50);

    const { data: row, error } = await context.supabase
      .from("daily_sales_claims")
      .insert({
        staff_id: staff.id,
        submitted_by: context.userId,
        sales_date: data.sales_date,
        total_amount: data.total_amount,
        evidence_files: files,
        remarks: data.remarks ?? "",
        status: "pending",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as DailySalesClaim;
  });

/** Signed URLs for the current user's evidence files (30 min). */
export const signDailySalesEvidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { paths: string[] }) => d)
  .handler(async ({ context, data }) => {
    const paths = (data.paths ?? []).filter(Boolean);
    if (!paths.length) return {} as Record<string, string>;
    const out: Record<string, string> = {};
    for (const p of paths) {
      const { data: signed } = await context.supabase.storage
        .from("daily-sales-evidence")
        .createSignedUrl(p, 60 * 30);
      if (signed?.signedUrl) out[p] = signed.signedUrl;
    }
    return out;
  });

/** Lightweight check: is the current user a Hunter? */
export const getMyHunterStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("staff")
      .select("id, name, role_family")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      staffId: data?.id ?? null,
      name: data?.name ?? null,
      isHunter: data?.role_family === "hunter",
    };
  });
