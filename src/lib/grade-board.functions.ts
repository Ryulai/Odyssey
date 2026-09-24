import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEPARTMENTS, normalizeKey, odysseyClassLabel, toDepartmentKey, type DepartmentKey } from "@/lib/taxonomy";

// Supervisor Grade Board — Manager/Director only.
// Groups are isolated: each Department ranks Staff-level employees only; Managers rank
// in their own group; Directors are in no group. "ALL" is a view container, not a ranking.

export type GroupKey = DepartmentKey | "manager";

export type BoardMember = {
  staff_id: string;
  name: string;
  department: string | null;
  class_label: string | null;
  /** Rank inside its own group for the selected period; null when no review in period. */
  rank: number | null;
  /** YYYY-MM -> A/B/C/D */
  grades: Record<string, string>;
};

export type BoardGroup = { key: GroupKey; label: string; members: BoardMember[] };

export type GradeBoard = {
  authorized: boolean;
  year: number;
  month: number | null;
  years: number[];
  groups: BoardGroup[];
};

export const getSupervisorGradeBoard = createServerFn({ method: "GET" })
  .inputValidator((d: { year?: number; month?: number | null } | undefined) => {
    const y = Number(d?.year) || new Date().getUTCFullYear();
    const m = d?.month == null ? null : Number(d.month);
    return { year: y, month: m != null && m >= 1 && m <= 12 ? m : null };
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }): Promise<GradeBoard> => {
    const rolesRes = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (rolesRes.error) throw new Error(rolesRes.error.message);
    const roles = new Set((rolesRes.data ?? []).map((r) => r.role as string));
    const empty: GradeBoard = { authorized: false, year: data.year, month: data.month, years: [], groups: [] };
    // Server-side boundary: only Manager or higher authority.
    if (!roles.has("manager") && !roles.has("director")) return empty;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [staffRes, identRes, rpgRes, evalRes] = await Promise.all([
      supabaseAdmin.from("staff").select("id, name, system_role").neq("status", "inactive"),
      supabaseAdmin.from("staff_identities").select("staff_id, class_key, role_key, is_primary"),
      supabaseAdmin.from("rpg_identity").select("staff_id, primary_class, primary_role"),
      supabaseAdmin.from("monthly_evaluations").select("staff_id, month, grade, composite_score"),
    ]);
    for (const r of [staffRes, identRes, rpgRes, evalRes] as any[]) if (r.error) throw new Error(r.error.message);

    const dept = new Map<string, DepartmentKey>();
    const cls = new Map<string, string>();
    for (const r of rpgRes.data ?? []) {
      const d = toDepartmentKey(r.primary_class); if (d) dept.set(r.staff_id, d);
      const c = normalizeKey(r.primary_role); if (c) cls.set(r.staff_id, c);
    }
    for (const r of identRes.data ?? []) {
      if (!r.is_primary) continue;
      const d = toDepartmentKey(r.class_key); if (d) dept.set(r.staff_id, d);
      const c = normalizeKey(r.role_key); if (c) cls.set(r.staff_id, c);
    }

    const years = new Set<number>([new Date().getUTCFullYear()]);
    const byStaff = new Map<string, Array<{ ym: string; grade: string; score: number }>>();
    for (const e of evalRes.data ?? []) {
      const ym = String(e.month).slice(0, 7);
      years.add(Number(ym.slice(0, 4)));
      const arr = byStaff.get(e.staff_id) ?? [];
      arr.push({ ym, grade: e.grade, score: Number(e.composite_score) || 0 });
      byStaff.set(e.staff_id, arr);
    }

    const prefix = data.month ? `${data.year}-${String(data.month).padStart(2, "0")}` : `${data.year}-`;
    const groups: BoardGroup[] = [
      ...DEPARTMENTS.map((d) => ({ key: d.key as GroupKey, label: d.label, members: [] as BoardMember[] })),
      { key: "manager", label: "Manager", members: [] },
    ];
    const scoreOf = new Map<string, number | null>();

    for (const s of staffRes.data ?? []) {
      let key: GroupKey | null = null;
      if (s.system_role === "manager") key = "manager";
      else if (s.system_role === "staff") key = dept.get(s.id) ?? null;
      if (!key) continue; // Directors and staff without a Department are outside all rankings.
      const evs = (byStaff.get(s.id) ?? []).filter((e) => e.ym.startsWith(String(data.year)));
      const grades: Record<string, string> = {};
      for (const e of evs) grades[e.ym] = e.grade;
      const period = evs.filter((e) => e.ym.startsWith(prefix));
      scoreOf.set(s.id, period.length ? period.reduce((a, e) => a + e.score, 0) / period.length : null);
      const d = dept.get(s.id) ?? null;
      groups.find((g) => g.key === key)!.members.push({
        staff_id: s.id,
        name: s.name,
        department: d ? DEPARTMENTS.find((x) => x.key === d)!.label : null,
        class_label: cls.get(s.id) ? odysseyClassLabel(cls.get(s.id)) : null,
        rank: null,
        grades,
      });
    }

    // Rank independently inside each group.
    for (const g of groups) {
      g.members.sort((a, b) => {
        const x = scoreOf.get(a.staff_id), y = scoreOf.get(b.staff_id);
        if (x == null && y == null) return a.name.localeCompare(b.name);
        if (x == null) return 1;
        if (y == null) return -1;
        return y - x || a.name.localeCompare(b.name);
      });
      let r = 0;
      for (const m of g.members) if (scoreOf.get(m.staff_id) != null) m.rank = ++r;
    }

    return { authorized: true, year: data.year, month: data.month, years: [...years].sort((a, b) => b - a), groups };
  });
