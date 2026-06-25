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
    if (error) throw new Error(error.message);
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
