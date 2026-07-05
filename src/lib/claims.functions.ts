import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("achievement_claims")
      .select("*, achievement:achievements(name, star_reward, difficulty), staff:staff(name, role)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const submitClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    staff_id: string;
    achievement_id: string;
    evidence_text: string;
    evidence_files?: string[];
    notes: string;
  }) => d)
  .handler(async ({ context, data }) => {
    const files = (data.evidence_files ?? []).slice(0, 10);

    // Duplicate-claim guard: no two non-rejected claims for the same achievement this month.
    const monthBucket = new Date().toISOString().slice(0, 7);
    const dup = await context.supabase
      .from("achievement_claims")
      .select("id, status")
      .eq("staff_id", data.staff_id)
      .eq("achievement_id", data.achievement_id)
      .eq("month_bucket", monthBucket)
      .neq("status", "rejected")
      .maybeSingle();
    if (dup.error) throw new Error(dup.error.message);
    if (dup.data) {
      throw new Error(
        dup.data.status === "approved"
          ? "Already approved this month — re-claim next cycle."
          : "A claim for this achievement is already pending this month.",
      );
    }

    const { data: row, error } = await context.supabase.from("achievement_claims").insert({
      staff_id: data.staff_id,
      achievement_id: data.achievement_id,
      evidence_text: data.evidence_text,
      evidence_files: files,
      evidence_url: files[0] ?? null,
      notes: data.notes,
      submitted_by: context.userId,
      status: "pending",
    }).select().single();
    if (error) {
      if ((error as any).code === "23505") throw new Error("Duplicate claim — already submitted this month.");
      throw new Error(error.message);
    }
    return row;
  });

export const decideClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; decision: "approved" | "rejected"; decision_notes?: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("achievement_claims")
      .update({
        status: data.decision,
        decision_notes: data.decision_notes ?? "",
        decided_by: context.userId,
        decided_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyRecords = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("achievement_records")
      .select("*, achievement:achievements(name, star_reward), staff:staff(name)")
      .order("awarded_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// 🧪 Minimal insert probe — inserts the smallest possible achievement_claims row
// to isolate which field/constraint is causing failures on Harbor Records.
export const testMinimalClaimInsert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<any> => {
    // Need a staff row + an achievement row (both NOT NULL FKs). Pick the first.
    const staff = await context.supabase.from("staff").select("id").limit(1).maybeSingle();
    if (staff.error) return { ok: false, step: "select staff", error: staff.error };
    if (!staff.data) return { ok: false, step: "select staff", error: { message: "no staff row visible" } };

    const ach = await context.supabase.from("achievements").select("id").limit(1).maybeSingle();
    if (ach.error) return { ok: false, step: "select achievements", error: ach.error };
    if (!ach.data) return { ok: false, step: "select achievements", error: { message: "no achievements row visible" } };

    const payload = {
      staff_id: staff.data.id,
      achievement_id: ach.data.id,
      submitted_by: context.userId,
    };

    const ins = await context.supabase.from("achievement_claims").insert(payload).select().single();
    if (ins.error) return { ok: false, step: "insert achievement_claims", payload, error: ins.error };
    return { ok: true, payload, row: ins.data };
  });
