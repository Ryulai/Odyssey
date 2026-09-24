import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DEPARTMENTS,
  classesOf,
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
  department: DepartmentKey | null;
  class_key: string | null;
  class_label: string | null;
  position: number;
  overall: number | null;
  grade: string | null;
  prev_overall: number | null;
  trend_delta: number | null;
  trend: "up" | "down" | "flat" | "new";
  achievements_count: number;
  is_me: boolean;
};

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
  sections: Array<{ key: DepartmentKey | "manager"; label: string; peers: PeerRow[] }>;
  groups: Array<{ key: "all" | DepartmentKey | "manager"; label: string }>;
  classes: TabItem[];
  active_group: "all" | DepartmentKey | "manager" | null;
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
  .inputValidator(
    (
      data:
        | {
            group?: string | null;
            class_key?: string | null;
            year?: number | null;
            month?: number | null;
          }
        | undefined,
    ) => {
      const y = Number(data?.year) || null;
      const m = Number(data?.month) || null;
      return {
        group: data?.group ? String(data.group).toLowerCase().trim() : null,
        class_key: data?.class_key ? String(data.class_key).toLowerCase().trim() : null,
        year: y,
        month: m && m >= 1 && m <= 12 ? m : null,
      };
    },
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }): Promise<PeerInsightsPayload> => {
    // Explicit Year + Month selection wins; otherwise the current month.
    const selected =
      data.year && data.month ? new Date(Date.UTC(data.year, data.month - 1, 1)) : new Date();
    const currentMonth = monthStart(selected);
    const previousMonth = prevMonthStart(selected);

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
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))) {
      if (!r.is_primary) continue;
      const d = toDepartmentKey(r.class_key);
      if (d) deptByStaff.set(r.staff_id, d);
      const c = normalizeKey(r.role_key);
      if (c) classByStaff.set(r.staff_id, c);
    }

    const myDept = meStaff ? (deptByStaff.get(meStaff.id) ?? null) : null;
    const myClass = meStaff ? (classByStaff.get(meStaff.id) ?? null) : null;

    const supervisor = authority === "manager" || authority === "director";
    const groups: PeerInsightsPayload["groups"] = supervisor
      ? [
          { key: "all", label: "All" },
          ...DEPARTMENTS.map((d) => ({ key: d.key, label: d.label })),
          { key: "manager", label: "Manager" },
        ]
      : myDept
        ? [{ key: myDept, label: departmentLabel(myDept) }]
        : [];

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

    const empty = (notice: string): PeerInsightsPayload => ({
      me: baseMe,
      month: currentMonth,
      sections: [],
      groups,
      classes: [],
      active_group: null,
      active_class: null,
      notice,
    });

    if (!meStaff && authority !== "director") {
      return empty(
        "You aren't on the crew manifest yet — Peer Insights unlocks once a Director adds you.",
      );
    }

    if (!myDept && !supervisor)
      return empty("Your department isn't set yet — ask a Director to complete your profile.");
    const requestedGroup = data.group as "all" | DepartmentKey | "manager" | null;
    if (requestedGroup && !groups.some((g) => g.key === requestedGroup)) {
      return empty("Locked — this ranking group is outside your access.");
    }
    const activeGroup = requestedGroup ?? (supervisor ? "all" : myDept);
    if (!activeGroup) return empty("No ranking group is available for this account.");

    const activeDept = activeGroup !== "all" && activeGroup !== "manager" ? activeGroup : null;
    const requestedClass = normalizeKey(data.class_key);
    const allowedClassKeys = activeDept ? classesOf(activeDept).map((c) => c.key) : [];
    if (requestedClass && (!activeDept || !allowedClassKeys.includes(requestedClass))) {
      return empty("Locked — this Class is outside the selected Department.");
    }
    if (!supervisor && requestedClass && requestedClass !== myClass) {
      return empty("Locked — Peer Insights is available for your own Class only.");
    }
    const activeClass = requestedClass ?? (!supervisor && activeDept === myDept ? myClass : null);
    const classTabs: TabItem[] = activeDept
      ? [
          ...(supervisor ? [{ key: "all", label: "All Classes", unlocked: true }] : []),
          ...classesOf(activeDept).map((c) => ({
            key: c.key,
            label: c.label,
            unlocked: supervisor || c.key === myClass,
          })),
        ]
      : [];

    const staffRes = await supabaseAdmin
      .from("staff")
      .select("id, name, current_rank_key, location_id, business_unit, manager_id, system_role")
      .neq("status", "inactive");
    if (staffRes.error) throw new Error(staffRes.error.message);
    const allStaff = staffRes.data ?? [];
    const sectionKeys: Array<DepartmentKey | "manager"> =
      activeGroup === "all" ? [...DEPARTMENTS.map((d) => d.key), "manager"] : [activeGroup];
    const eligible = allStaff.filter((s) =>
      sectionKeys.some((key) =>
        key === "manager"
          ? s.system_role === "manager"
          : s.system_role === "staff" && deptByStaff.get(s.id) === key,
      ),
    );
    const locationIds = Array.from(
      new Set(eligible.map((p) => p.location_id).filter(Boolean)),
    ) as string[];
    const allLocIds = Array.from(
      new Set([...locationIds, ...(baseMe?.location_id ? [baseMe.location_id] : [])]),
    );
    const locRes: {
      data: Array<{ id: string; name: string }> | null;
      error: { message: string } | null;
    } = allLocIds.length
      ? await supabaseAdmin.from("locations").select("id, name").in("id", allLocIds)
      : { data: [], error: null };
    if (locRes.error) throw new Error(locRes.error.message);
    const locMap = new Map<string, string>();
    for (const l of locRes.data ?? []) locMap.set(l.id, l.name);

    const me = baseMe
      ? {
          ...baseMe,
          location_name: baseMe.location_id ? (locMap.get(baseMe.location_id) ?? null) : null,
        }
      : null;

    const peerIds = eligible.map((p) => p.id);
    if (!peerIds.length)
      return {
        me,
        month: currentMonth,
        sections: sectionKeys.map((key) => ({
          key,
          label: key === "manager" ? "Manager" : departmentLabel(key),
          peers: [],
        })),
        groups,
        classes: classTabs,
        active_group: activeGroup,
        active_class: activeClass,
      };
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
    for (const r of [evalsRes, prevEvalsRes, achRes]) if (r.error) throw new Error(r.error.message);

    const evalMap = new Map<
      string,
      { staff_id: string; composite_score: number | null; grade: string | null }
    >();
    for (const e of evalsRes.data ?? []) evalMap.set(e.staff_id, e);
    const prevMap = new Map<string, number>();
    for (const e of prevEvalsRes.data ?? [])
      prevMap.set(e.staff_id, Number(e.composite_score) || 0);
    const achMap = new Map<string, number>();
    for (const a of achRes.data ?? []) achMap.set(a.staff_id, (achMap.get(a.staff_id) ?? 0) + 1);

    const sections = sectionKeys.map((key) => {
      const members = eligible.filter((s) =>
        key === "manager"
          ? s.system_role === "manager"
          : s.system_role === "staff" && deptByStaff.get(s.id) === key,
      );
      const ranked = members.map((p) => {
        const e = evalMap.get(p.id);
        const overall = e ? Number(e.composite_score) : null;
        const prev = prevMap.get(p.id) ?? null;
        const delta = overall !== null && prev !== null ? overall - prev : null;
        const trend: PeerRow["trend"] =
          overall === null
            ? "new"
            : prev === null
              ? "flat"
              : delta !== null && delta > 0.5
                ? "up"
                : delta !== null && delta < -0.5
                  ? "down"
                  : "flat";
        const department = deptByStaff.get(p.id) ?? null;
        const classKey = classByStaff.get(p.id) ?? null;
        return {
          staff_id: p.id,
          name: p.name,
          rank_key: p.current_rank_key,
          location_id: p.location_id,
          location_name: p.location_id ? (locMap.get(p.location_id) ?? null) : null,
          department,
          class_key: classKey,
          class_label: classKey ? odysseyClassLabel(classKey) : null,
          position: 0,
          overall,
          grade: e?.grade ?? null,
          prev_overall: prev,
          trend_delta: delta,
          trend,
          achievements_count: achMap.get(p.id) ?? 0,
          is_me: !!meStaff && p.id === meStaff.id,
        } satisfies PeerRow;
      });
      ranked.sort((a, b) => {
        if (a.overall === null && b.overall === null) return a.name.localeCompare(b.name);
        if (a.overall === null) return 1;
        if (b.overall === null) return -1;
        return b.overall - a.overall;
      });
      ranked.forEach((row, index) => {
        row.position = index + 1;
      });
      const visible =
        activeClass && key !== "manager"
          ? ranked.filter((row) => row.class_key === activeClass)
          : ranked;
      return { key, label: key === "manager" ? "Manager" : departmentLabel(key), peers: visible };
    });

    return {
      me,
      month: currentMonth,
      sections,
      groups,
      classes: classTabs,
      active_group: activeGroup,
      active_class: activeClass,
    };
  });
