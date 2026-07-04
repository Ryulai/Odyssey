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
  decision_notes: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

export type DailySalesReviewRow = DailySalesClaim & {
  staff: {
    id: string;
    name: string;
    business_unit: string | null;
    primary_class: string | null;
    primary_role: string | null;
  };
  reviewer_name: string | null;
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

async function ensureReviewer(context: { supabase: any; userId: string }) {
  const [mgr, dir] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "manager" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "director" }),
  ]);
  if (mgr.error) throw new Error(mgr.error.message);
  if (dir.error) throw new Error(dir.error.message);
  if (!mgr.data && !dir.data) throw new Error("Only Captains, Managers or Admin can review Daily Sales.");
}

/** List every Daily Sales Claim for the review dashboard. Managers/Directors only. */
export const listSalesForReview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: "pending" | "approved" | "rejected" | "all" }) => d)
  .handler(async ({ context, data }) => {
    await ensureReviewer(context);
    let q = context.supabase
      .from("daily_sales_claims")
      .select("*, staff:staff(id, name, business_unit, rpg:rpg_identity(primary_class, primary_role))")
      .order("created_at", { ascending: false });
    if (data?.status && data.status !== "all") q = q.eq("status", data.status);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // Resolve reviewer display names via profiles.
    const reviewerIds = Array.from(
      new Set((rows ?? []).map((r: any) => r.reviewed_by).filter(Boolean)),
    ) as string[];
    let reviewerMap: Record<string, string> = {};
    if (reviewerIds.length) {
      const p = await context.supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", reviewerIds);
      if (p.error) throw new Error(p.error.message);
      reviewerMap = Object.fromEntries(
        (p.data ?? []).map((r: any) => [r.id, r.full_name || r.email || "Reviewer"]),
      );
    }

    return (rows ?? []).map((r: any) => ({
      ...r,
      staff: {
        id: r.staff?.id ?? r.staff_id,
        name: r.staff?.name ?? "Unknown",
        business_unit: r.staff?.business_unit ?? null,
        primary_class: r.staff?.rpg?.primary_class ?? null,
        primary_role: r.staff?.rpg?.primary_role ?? null,
      },
      reviewer_name: r.reviewed_by ? reviewerMap[r.reviewed_by] ?? null : null,
    })) as DailySalesReviewRow[];
  });

/** Signed URLs for reviewer viewing (30 min). Managers/Directors only. */
export const signSalesEvidenceForReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { paths: string[] }) => d)
  .handler(async ({ context, data }) => {
    await ensureReviewer(context);
    const paths = (data.paths ?? []).filter(Boolean);
    const out: Record<string, string> = {};
    for (const p of paths) {
      const { data: signed } = await context.supabase.storage
        .from("daily-sales-evidence")
        .createSignedUrl(p, 60 * 30);
      if (signed?.signedUrl) out[p] = signed.signedUrl;
    }
    return out;
  });

/** Decide (approve/reject) a Daily Sales Claim. Managers/Directors only. */
export const decideDailySales = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; decision: "approved" | "rejected"; decision_notes?: string }) => d)
  .handler(async ({ context, data }) => {
    await ensureReviewer(context);
    if (data.decision === "rejected" && !(data.decision_notes ?? "").trim()) {
      throw new Error("A rejection reason is required.");
    }
    const { data: row, error } = await context.supabase
      .from("daily_sales_claims")
      .update({
        status: data.decision,
        decision_notes: data.decision_notes ?? "",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

