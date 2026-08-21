import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DEPARTMENTS,
  classesOf,
  departmentDbKey,
  departmentLabel,
  normalizeKey,
  odysseyClassLabel,
  toDepartmentKey,
  type Authority,
  type DepartmentKey,
} from "@/lib/taxonomy";

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
  | { kind: "department"; label: string }
  | { kind: "organization"; label: string };

export type TabItem = {
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
    /** Organizational authority — independent from Department/Class. */
    authority: Authority;
    department: DepartmentKey | null;
    class_key: string | null;
  } | null;
  month: string;
  peers: PeerRow[];
  scope: PeerScope;
  /** Department tabs; `unlocked` is authoritative and enforced server-side. */
  departments: TabItem[];
  /** Classes of the active Department; `unlocked` enforced server-side. */
  classes: TabItem[];
  active_department: DepartmentKey | null;
  active_class: string | null;
  notice?: string;
};

function monthStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}
function prevMonthStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).toISOString().slice(0, 10);
}

export const getPeerInsights = createServerFn({ method: "GET" })
  .inputValidator((data: { department?: string | null; class_key?: string | null } | undefined) => ({
    department: data?.department ? String(data.department).toLowerCase().trim() : null,
    class_key: data?.class_key ? String(data.class_key).toLowerCase().trim() : null,
  }))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }): Promise<PeerInsightsPayload> => {
    const currentMonth = monthStart();
    const previousMonth = prevMonthStart();

    // ---- Role / Authority (highest privilege wins) ----
    const rolesRes = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (rolesRes.error) throw new Error(rolesRes.error.message);
    const roleSet = new Set((rolesRes.data ?? []).map((r) => r.role as string));
    const authority: Authority = roleSet.has("director")
      ? "director"
      : roleSet.has("manager")
        ? "manager"
        : "staff";

    // ---- Caller's staff record ----
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

    // ---- Identity maps: department (class_key) + class (role_key) ----
    const [identAll, rpgAll] = await Promise.all([
      supabaseAdmin
        .from("staff_identities")
        .select("staff_id, class_key, role_key, is_primary, position"),
      supabaseAdmin.from("rpg_identity").select("staff_id, primary_class, primary_role"),
    ]);
    if (identAll.error) throw new Error(identAll.error.message);
    if (rpgAll.error) throw new Error(rpgAll.error.message);

    const deptByStaff = new Map<string, DepartmentKey>();
    const classByStaff = new Map<string, string>();
    for (const r of rpgAll.data ?? []) {
      const d = toDepartmentKey(r.primary_class);
      if (d) deptByStaff.set(r.staff_id, d);
      const c = normalizeKey(r.primary_role);
      if (c) classByStaff.set(r.staff_id, c);
    }
    for (const r of (identAll.data ?? [])
      .slice()
      .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))) {
      if (!r.is_primary) continue;
      const d = toDepartmentKey(r.class_key);
      if (d) deptByStaff.set(r.staff_id, d);
      const c = normalizeKey(r.role_key);
      if (c) classByStaff.set(r.staff_id, c);
    }

    const myDept = meStaff ? deptByStaff.get(meStaff.id) ?? null : null;
    const myClass = meStaff ? classByStaff.get(meStaff.id) ?? null : null;

    // ---- Authorization helpers ----
    const canSeeDept = (d: DepartmentKey) => authority === "director" || (!!myDept && d === myDept);
    const canSeeClass = (d: DepartmentKey, c: string) => {
      if (authority === "director") return true;
      if (!canSeeDept(d)) return false;
      // Managers cover their whole department; staff only their own class.
      if (authority === "manager") return true;
      return !!myClass && c === myClass;
    };

    const departmentTabs: TabItem[] = DEPARTMENTS.map((d) => ({
      key: d.key,
      label: d.label,
      unlocked: canSeeDept(d.key),
    }));

    const baseMe = meStaff
      ? {
          staff_id: meStaff.id,
          name: meStaff.name,
          rank_key: meStaff.current_rank_key,
          location_id: meStaff.location_id,
          location_name: null as string | null,
          authority,
          department: myDept,
          class_key: myClass,
        }
      : null;

    const empty = (notice: string, dep: DepartmentKey | null = null, cls: string | null = null): PeerInsightsPayload => ({
      me: baseMe,
      month: currentMonth,
      peers: [],
      scope: { kind: "class", label: "Your class" },
      departments: departmentTabs,
      classes: dep
        ? classesOf(dep).map((c) => ({ key: c.key, label: c.label, unlocked: canSeeClass(dep, c.key) }))
        : [],
      active_department: dep,
      active_class: cls,
      notice,
    });

    if (!meStaff && authority !== "director") {
      return empty("You aren't on the crew manifest yet — Peer Insights unlocks once a Director adds you.");
    }

    // ---- Resolve active Department ----
    const requestedDept = toDepartmentKey(data.department);
    let activeDept: DepartmentKey | null;
    if (authority === "director") {
      activeDept = requestedDept ?? myDept ?? DEPARTMENTS[0].key;
    } else {
      if (!myDept) return empty("Your department isn't set yet — ask a Director to complete your profile.");
      if (requestedDept && requestedDept !== myDept) {
        return empty("Locked — Peer Insights is limited to your own department.", myDept, myClass);
      }
      activeDept = myDept;
    }

    const classTabs: TabItem[] = classesOf(activeDept).map((c) => ({
      key: c.key,
      label: c.label,
      unlocked: canSeeClass(activeDept!, c.key),
    }));

    // ---- Resolve active Class ----
    const requestedClass = normalizeKey(data.class_key);
    let activeClass: string | null;
    if (requestedClass) {
      if (!canSeeClass(activeDept, requestedClass)) {
        return empty("Locked — Peer Insights is available for your own class only.", activeDept, myClass);
      }
      activeClass = requestedClass;
    } else if (myDept === activeDept && myClass) {
      activeClass = myClass;
    } else {
      activeClass = classTabs.find((t) => t.unlocked)?.key ?? null;
    }

    if (!activeClass) {
      return empty("No classes are configured for this department yet.", activeDept, null);
    }

    const scope: PeerScope = {
      kind: authority === "director" ? "organization" : "class",
      label: `${departmentLabel(activeDept)} · ${odysseyClassLabel(activeClass)}`,
    };

    // ---- Members of the active Department + Class (server-side filter) ----
    let staffQuery = supabaseAdmin
      .from("staff")
      .select("id, name, current_rank_key, location_id, business_unit, manager_id")
      .neq("status", "inactive");

    // Managers stay inside their own business unit where the data supports it.
    if (authority === "manager" && meStaff?.business_unit) {
      staffQuery = staffQuery.eq("business_unit", meStaff.business_unit);
    }

    const staffRes = await staffQuery;
    if (staffRes.error) throw new Error(staffRes.error.message);

    const peerStaff = (staffRes.data ?? []).filter(
      (s: any) => deptByStaff.get(s.id) === activeDept && classByStaff.get(s.id) === activeClass,
    ) as Array<{ id: string; name: string; current_rank_key: string | null; location_id: string | null }>;

    // Location names.
    const locationIds = Array.from(new Set(peerStaff.map((p) => p.location_id).filter(Boolean))) as string[];
    const allLocIds = Array.from(new Set([...locationIds, ...(baseMe?.location_id ? [baseMe.location_id] : [])]));
    const locRes = allLocIds.length
      ? await supabaseAdmin.from("locations").select("id, name").in("id", allLocIds)
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
        departments: departmentTabs,
        classes: classTabs,
        active_department: activeDept,
        active_class: activeClass,
        notice: `No ${odysseyClassLabel(activeClass)} crew in this department yet.`,
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

    return {
      me,
      month: currentMonth,
      peers,
      scope,
      departments: departmentTabs,
      classes: classTabs,
      active_department: activeDept,
      active_class: activeClass,
    };
  });

// Keeps `departmentDbKey` reachable for future write paths without changing schema.
export const __TAXONOMY_DB_KEY = departmentDbKey;
