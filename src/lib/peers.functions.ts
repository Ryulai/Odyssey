import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PeerRow = {
  staff_id: string;
  name: string;
  rank_key: string | null;
  location_id: string | null;
  location_name: string | null;
  overall: number;
  grade: string | null;
  prev_overall: number | null;
  trend: "up" | "down" | "flat" | "new";
  achievements_count: number;
  is_me: boolean;
};

export type PeerScope =
  | { kind: "class"; label: string }
  | { kind: "organization"; label: string };

export type ClassTab = {
  key: string;
  label: string;
  unlocked: boolean;
};

export type PeerInsightsPayload = {
  me: {
    staff_id: string;
    name: string;
    rank_key: string | null;
    location_id: string | null;
    location_name: string | null;
    role: "director" | "manager" | "staff";
    class_key: string | null;
  } | null;
  month: string;
  peers: PeerRow[];
  scope: PeerScope;
  /** Class tabs the caller may see; `unlocked` is authoritative and enforced server-side. */
  tabs: ClassTab[];
  /** Class currently rendered, or null when nothing could be resolved. */
  active_class: string | null;
  notice?: string;
};

const CLASS_LABELS: Record<string, string> = {
  ranger: "Ranger",
  warrior: "Warrior",
  mage: "Mage",
  guardian: "Guardian",
};
const ALL_CLASSES = Object.keys(CLASS_LABELS);

function monthStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}
function prevMonthStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).toISOString().slice(0, 10);
}

export const getPeerInsights = createServerFn({ method: "GET" })
  .inputValidator((data: { class_key?: string | null } | undefined) => ({
    class_key: data?.class_key ? String(data.class_key).toLowerCase().trim() : null,
  }))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }): Promise<PeerInsightsPayload> => {
    const currentMonth = monthStart();
    const previousMonth = prevMonthStart();

    // Caller role (highest privilege wins).
    const rolesRes = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (rolesRes.error) throw new Error(rolesRes.error.message);
    const roleSet = new Set((rolesRes.data ?? []).map((r) => r.role as string));
    const callerRole: "director" | "manager" | "staff" = roleSet.has("director")
      ? "director"
      : roleSet.has("manager")
        ? "manager"
        : "staff";

    // Caller's staff record.
    const meRes = await context.supabase
      .from("staff")
      .select("id, name, current_rank_key, location_id, business_unit")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (meRes.error) throw new Error(meRes.error.message);
    const meStaff = meRes.data;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Resolve a staff member's primary class from the existing taxonomy.
    async function classOf(staffId: string): Promise<string | null> {
      const [identRes, rpgRes] = await Promise.all([
        supabaseAdmin
          .from("staff_identities")
          .select("class_key, is_primary, position")
          .eq("staff_id", staffId)
          .order("position", { ascending: true }),
        supabaseAdmin.from("rpg_identity").select("primary_class").eq("staff_id", staffId).maybeSingle(),
      ]);
      const primary = (identRes.data ?? []).find((i: any) => i.is_primary) ?? (identRes.data ?? [])[0];
      return (primary?.class_key as string | null) ?? (rpgRes.data?.primary_class as string | null) ?? null;
    }

    const myClass = meStaff ? await classOf(meStaff.id) : null;

    const emptyTabs = (unlockedKey: string | null): ClassTab[] =>
      ALL_CLASSES.map((k) => ({
        key: k,
        label: CLASS_LABELS[k],
        unlocked: callerRole === "director" || (!!unlockedKey && k === unlockedKey),
      }));
    const tabs = emptyTabs(myClass);

    const baseMe = meStaff
      ? {
          staff_id: meStaff.id,
          name: meStaff.name,
          rank_key: meStaff.current_rank_key,
          location_id: meStaff.location_id,
          location_name: null as string | null,
          role: callerRole,
          class_key: myClass,
        }
      : null;

    if (!meStaff && callerRole !== "director") {
      return {
        me: null,
        month: currentMonth,
        peers: [],
        scope: { kind: "class", label: "Your class" },
        tabs,
        active_class: null,
        notice: "You aren't on the crew manifest yet — Peer Insights unlocks once a Director adds you.",
      };
    }

    // ---- Authorization: which class may be rendered ----
    let activeClass: string | null;
    if (callerRole === "director") {
      activeClass = data.class_key && ALL_CLASSES.includes(data.class_key) ? data.class_key : (myClass ?? ALL_CLASSES[0]);
    } else {
      if (!myClass) {
        return {
          me: baseMe,
          month: currentMonth,
          peers: [],
          scope: { kind: "class", label: "Your class" },
          tabs,
          active_class: null,
          notice: "Your class isn't set yet — ask a Director to complete your profile.",
        };
      }
      // Any request for another class is refused server-side.
      if (data.class_key && data.class_key !== myClass) {
        return {
          me: baseMe,
          month: currentMonth,
          peers: [],
          scope: { kind: "class", label: CLASS_LABELS[myClass] ?? myClass },
          tabs,
          active_class: myClass,
          notice: "Locked — available to your class only.",
        };
      }
      activeClass = myClass;
    }

    const scope: PeerScope =
      callerRole === "director"
        ? { kind: "organization", label: `Organization · ${CLASS_LABELS[activeClass!] ?? activeClass}` }
        : { kind: "class", label: `Your class · ${CLASS_LABELS[activeClass!] ?? activeClass}` };

    // ---- Members of the active class (server-side filter) ----
    const [identAll, rpgAll] = await Promise.all([
      supabaseAdmin.from("staff_identities").select("staff_id, class_key, is_primary, position"),
      supabaseAdmin.from("rpg_identity").select("staff_id, primary_class"),
    ]);
    if (identAll.error) throw new Error(identAll.error.message);
    if (rpgAll.error) throw new Error(rpgAll.error.message);

    const classByStaff = new Map<string, string>();
    for (const r of rpgAll.data ?? []) if (r.primary_class) classByStaff.set(r.staff_id, r.primary_class);
    for (const r of (identAll.data ?? []).slice().sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))) {
      if (r.is_primary && r.class_key) classByStaff.set(r.staff_id, r.class_key);
    }

    let staffQuery = supabaseAdmin
      .from("staff")
      .select("id, name, current_rank_key, location_id, business_unit, manager_id")
      .neq("status", "inactive");

    // Managers are limited to their own department in addition to their class.
    if (callerRole === "manager" && meStaff?.business_unit) {
      staffQuery = staffQuery.eq("business_unit", meStaff.business_unit);
    }

    const staffRes = await staffQuery;
    if (staffRes.error) throw new Error(staffRes.error.message);

    const peerStaff = (staffRes.data ?? []).filter(
      (s: any) => classByStaff.get(s.id) === activeClass,
    ) as Array<{ id: string; name: string; current_rank_key: string | null; location_id: string | null }>;

    // Location names.
    const locationIds = Array.from(new Set(peerStaff.map((p) => p.location_id).filter(Boolean))) as string[];
    const locRes = locationIds.length
      ? await supabaseAdmin.from("locations").select("id, name").in("id", locationIds)
      : ({ data: [], error: null } as any);
    if ((locRes as any).error) throw new Error((locRes as any).error.message);
    const locMap = new Map<string, string>();
    for (const l of (locRes as any).data ?? []) locMap.set(l.id, l.name);

    const me = baseMe
      ? { ...baseMe, location_name: baseMe.location_id ? locMap.get(baseMe.location_id) ?? null : null }
      : null;

    if (!peerStaff.length) {
      return {
        me,
        month: currentMonth,
        peers: [],
        scope,
        tabs,
        active_class: activeClass,
        notice: "No Hunters in this class yet.",
      };
    }

    const peerIds = peerStaff.map((p) => p.id);
    const [evalsRes, prevEvalsRes, achRes] = await Promise.all([
      supabaseAdmin
        .from("monthly_evaluations")
        .select("staff_id, composite_score, grade")
        .in("staff_id", peerIds)
        .eq("month", currentMonth),
      supabaseAdmin
        .from("monthly_evaluations")
        .select("staff_id, composite_score")
        .in("staff_id", peerIds)
        .eq("month", previousMonth),
      supabaseAdmin.from("achievement_records").select("staff_id").in("staff_id", peerIds),
    ]);
    for (const r of [evalsRes, prevEvalsRes, achRes] as any[]) if (r.error) throw new Error(r.error.message);

    const evalMap = new Map<string, any>();
    for (const e of evalsRes.data ?? []) evalMap.set(e.staff_id, e);
    const prevMap = new Map<string, number>();
    for (const e of prevEvalsRes.data ?? []) prevMap.set(e.staff_id, Number(e.composite_score) || 0);
    const achMap = new Map<string, number>();
    for (const a of achRes.data ?? []) achMap.set(a.staff_id, (achMap.get(a.staff_id) ?? 0) + 1);

    const peers: PeerRow[] = peerStaff.map((p) => {
      const e = evalMap.get(p.id);
      const overall = Number(e?.composite_score ?? 0);
      const prev = prevMap.get(p.id) ?? null;
      const trend: PeerRow["trend"] = !e
        ? "new"
        : prev === null
          ? "flat"
          : overall > prev + 0.5
            ? "up"
            : overall < prev - 0.5
              ? "down"
              : "flat";
      return {
        staff_id: p.id,
        name: p.name,
        rank_key: p.current_rank_key,
        location_id: p.location_id,
        location_name: p.location_id ? locMap.get(p.location_id) ?? null : null,
        overall,
        grade: e?.grade ?? null,
        prev_overall: prev,
        trend,
        achievements_count: achMap.get(p.id) ?? 0,
        is_me: !!meStaff && p.id === meStaff.id,
      };
    });

    peers.sort((x, y) => y.overall - x.overall);

    return { me, month: currentMonth, peers, scope, tabs, active_class: activeClass };
  });
