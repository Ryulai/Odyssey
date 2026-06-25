import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** A Legacy Holding = a permanent title (Founder, Partner, Investor…) optionally tied to a fleet.
 *  Independent of current Work Identity. A person can hold many. */
export type LegacyHolding = {
  id: string;
  staff_id: string;
  title: string;
  location_id: string | null;
  note: string;
  granted_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

async function isDirector(context: any) {
  const { data } = await context.supabase
    .from("user_roles").select("role").eq("user_id", context.userId);
  return (data ?? []).some((r: any) => r.role === "director");
}

/** Cross-fleet registry (all titles, all people). */
export const listLegacyHoldings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("legacy_holdings")
      .select("*, staff:staff(id, name, email), location:locations(id, name, code)")
      .order("granted_at", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Holdings for one person. */
export const listLegacyHoldingsFor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { staff_id: string }) => d)
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("legacy_holdings")
      .select("*, location:locations(id, name, code)")
      .eq("staff_id", data.staff_id)
      .order("granted_at", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertLegacyHolding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string; staff_id: string; title: string;
    location_id?: string | null; note?: string;
    granted_at?: string | null; ended_at?: string | null;
  }) => d)
  .handler(async ({ context, data }) => {
    if (!(await isDirector(context))) throw new Error("Forbidden — Director only.");
    const payload: any = {
      staff_id: data.staff_id,
      title: data.title.trim(),
      location_id: data.location_id ?? null,
      note: data.note ?? "",
      granted_at: data.granted_at || null,
      ended_at: data.ended_at || null,
    };
    if (data.id) payload.id = data.id;
    const { data: row, error } = await context.supabase
      .from("legacy_holdings").upsert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteLegacyHolding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    if (!(await isDirector(context))) throw new Error("Forbidden — Director only.");
    const { error } = await context.supabase
      .from("legacy_holdings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
