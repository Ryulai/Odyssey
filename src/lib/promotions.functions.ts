import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// -------------------------------------------------------------------
// Promotion Engine
// -------------------------------------------------------------------
// Evaluates a Hunter's readiness to move from their current Rank to the
// next Rank. Reads state (evaluate_rank RPC + monthly_evaluations +
// identity + achievement_records + claims) — never mutates. Runs on
// every read, so a fresh review invalidating the query re-computes.
//
// Requirements checked (per Odyssey Ranking spec):
//   1. Overall Performance Score       (avg composite over last 3 mo)
//   2. A/B/C/D category consistency    (latest grade in {A, B})
//   3. Monthly consistency             (≥ N qualifying reviews)
//   4. Achievement completion          (stars vs next rank floor)
//   5. Mission completion              (approved claims vs floor)
//   6. Time in current rank            (days since rank change)
//   7. Mandatory                       (A-grade / B-grade floors)
// -------------------------------------------------------------------

export type PromotionRequirement = {
  key: string;
  label: string;
  detail: string;
  have: number | string;
  need: number | string;
  done: boolean;
  mandatory: boolean;
  weight: number;
};

export type PromotionEntry = {
  from_rank_key: string | null;
  from_rank_name: string | null;
  to_rank_key: string;
  to_rank_name: string;
  promoted_at: string;
  source: string;
};

export type PerformanceMonth = {
  month: string; // "YYYY-MM-01"
  grade: "A" | "B" | "C" | "D" | null;
  score: number | null;
};

export type PromotionProgress = {
  staff: { id: string; name: string; role: string | null } | null;
  identity_id: string | null;
  current_rank_key: string | null;
  current_rank_name: string | null;
  next_rank_key: string | null;
  next_rank_name: string | null;
  percent: number;
  eligible: boolean;
  days_in_rank: number | null;
  /** False when the next Rank's criteria are not yet defined (Gold and above). */
  criteria_defined: boolean;
  requirements: PromotionRequirement[];
  completed: PromotionRequirement[];
  remaining: PromotionRequirement[];
  readiness: {
    label: "Ready" | "Near" | "Building" | "Early" | "Max";
    tone: "ok" | "warn" | "info" | "gold";
    eta_months: number | null;
    note: string;
  };
  history: PromotionEntry[];
  performance_history: PerformanceMonth[];
  totals: { total_stars: number; a_grades: number; b_grades: number; unique_achievements: number };
  scores: {
    overall_avg_3mo: number | null;
    latest_grade: "A" | "B" | "C" | "D" | null;
    qualifying_last3: number; // # reviews with grade A or B in last 3 months
    approved_claims: number;
  };
};

/**
 * Ranking V1: only these promotions have confirmed criteria. Anything beyond
 * Gold is intentionally undefined — never invent requirements for it.
 */
const DEFINED_NEXT_RANKS = new Set(["apprentice", "bronze", "silver", "gold"]);

// Overall Performance threshold — sales+behaviour composite average.
const OVERALL_MIN_AVG = 70;
const CONSISTENCY_WINDOW = 3;   // months
const CONSISTENCY_MIN = 2;      // qualifying reviews in window
const TIME_IN_RANK_MIN_DAYS = 90;
const MISSION_COMPLETION_MIN = 3; // approved claims since last promotion

export const getPromotionProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { staff_id?: string }) => d ?? {})
  .handler(async ({ context, data }) => {
    // Resolve target staff (self by default)
    let staffId = data.staff_id ?? "";
    if (!staffId) {
      const me = await context.supabase
        .from("staff")
        .select("id")
        .eq("user_id", context.userId)
        .limit(1)
        .maybeSingle();
      staffId = me.data?.id ?? "";
    }
    if (!staffId) return empty();

    const [staffRes, evalRes, monthlyRes, identityRes, claimsRes] = await Promise.all([
      context.supabase
        .from("staff")
        .select("id, name, role, current_rank_key")
        .eq("id", staffId)
        .maybeSingle(),
      context.supabase.rpc("evaluate_rank", { _staff_id: staffId }).maybeSingle(),
      context.supabase
        .from("monthly_evaluations")
        .select("month, grade, composite_score")
        .eq("staff_id", staffId)
        .order("month", { ascending: false })
        .limit(6),
      context.supabase
        .from("staff_identities")
        .select("id, rank_key, promotion_state, updated_at, created_at")
        .eq("staff_id", staffId)
        .eq("is_primary", true)
        .maybeSingle(),
      context.supabase
        .from("achievement_claims")
        .select("status, decided_at")
        .eq("staff_id", staffId)
        .eq("status", "approved"),
    ]);

    for (const r of [staffRes, evalRes, monthlyRes, identityRes, claimsRes]) {
      if ((r as any).error) throw new Error((r as any).error.message);
    }

    const staff = staffRes.data;
    if (!staff) return empty();
    const ev: any = evalRes.data ?? {};
    const monthly = (monthlyRes.data ?? []) as { month: string; grade: string | null; composite_score: number | null }[];
    const identity: any = identityRes.data;
    const approvedClaims = (claimsRes.data ?? []).length;

    // Time in rank (best-effort: identity.updated_at is bumped on rank
    // change; fall back to created_at, then null).
    const rankTimestamp = identity?.updated_at ?? identity?.created_at ?? null;
    const daysInRank = rankTimestamp
      ? Math.max(0, Math.floor((Date.now() - new Date(rankTimestamp).getTime()) / 86_400_000))
      : null;

    // Overall performance: average composite over last 3 months.
    const last3 = monthly.slice(0, CONSISTENCY_WINDOW);
    const composites = last3.map((m) => Number(m.composite_score ?? 0)).filter((n) => n > 0);
    const overallAvg = composites.length ? composites.reduce((a, b) => a + b, 0) / composites.length : null;
    const latestGrade = (monthly[0]?.grade ?? null) as PromotionProgress["scores"]["latest_grade"];
    const qualifyingLast3 = last3.filter((m) => m.grade === "A" || m.grade === "B").length;

    const promotionHistory = readHistory(identity?.promotion_state);

    // Build requirements list only when a next rank exists.
    const requirements: PromotionRequirement[] = [];

    if (ev?.next_rank_key) {
      requirements.push({
        key: "overall",
        label: "Overall Performance",
        detail: `3-month average performance ≥ ${OVERALL_MIN_AVG}`,
        have: overallAvg !== null ? Math.round(overallAvg) : "—",
        need: OVERALL_MIN_AVG,
        done: (overallAvg ?? 0) >= OVERALL_MIN_AVG,
        mandatory: false,
        weight: 2,
      });
      requirements.push({
        key: "grade",
        label: "Latest Monthly Grade",
        detail: "Most recent review must be A or B",
        have: latestGrade ?? "—",
        need: "A / B",
        done: latestGrade === "A" || latestGrade === "B",
        mandatory: true,
        weight: 2,
      });
      requirements.push({
        key: "consistency",
        label: "Monthly Consistency",
        detail: `${CONSISTENCY_MIN} qualifying reviews in the last ${CONSISTENCY_WINDOW} months`,
        have: qualifyingLast3,
        need: CONSISTENCY_MIN,
        done: qualifyingLast3 >= CONSISTENCY_MIN,
        mandatory: false,
        weight: 1,
      });
      requirements.push({
        key: "a_grades",
        label: "A-Grade Months (mandatory)",
        detail: "Cumulative A grades earned",
        have: Number(ev.a_grades ?? 0),
        need: Number(ev.next_min_a_grades ?? 0),
        done: Number(ev.a_grades ?? 0) >= Number(ev.next_min_a_grades ?? 0),
        mandatory: true,
        weight: 2,
      });
      requirements.push({
        key: "b_grades",
        label: "B-Grade Months (mandatory)",
        detail: "Cumulative B grades earned",
        have: Number(ev.b_grades ?? 0),
        need: Number(ev.next_min_b_grades ?? 0),
        done: Number(ev.b_grades ?? 0) >= Number(ev.next_min_b_grades ?? 0),
        mandatory: true,
        weight: 1,
      });
      requirements.push({
        key: "stars",
        label: "Achievement Stars",
        detail: "Cumulative stars earned",
        have: Number(ev.total_stars ?? 0),
        need: Number(ev.next_min_total_stars ?? 0),
        done: Number(ev.total_stars ?? 0) >= Number(ev.next_min_total_stars ?? 0),
        mandatory: false,
        weight: 2,
      });
      requirements.push({
        key: "unique",
        label: "Unique Achievements",
        detail: "Distinct achievements unlocked",
        have: Number(ev.unique_achievements ?? 0),
        need: Number(ev.next_min_achievements ?? 0),
        done: Number(ev.unique_achievements ?? 0) >= Number(ev.next_min_achievements ?? 0),
        mandatory: false,
        weight: 1,
      });
      requirements.push({
        key: "missions",
        label: "Mission Completion",
        detail: "Approved achievement claims on record",
        have: approvedClaims,
        need: MISSION_COMPLETION_MIN,
        done: approvedClaims >= MISSION_COMPLETION_MIN,
        mandatory: false,
        weight: 1,
      });
      requirements.push({
        key: "tenure",
        label: "Time in Current Rank",
        detail: `${TIME_IN_RANK_MIN_DAYS} days minimum in current rank`,
        have: daysInRank !== null ? `${daysInRank}d` : "—",
        need: `${TIME_IN_RANK_MIN_DAYS}d`,
        done: (daysInRank ?? 0) >= TIME_IN_RANK_MIN_DAYS,
        mandatory: true,
        weight: 1,
      });
    }

    const completed = requirements.filter((r) => r.done);
    const remaining = requirements.filter((r) => !r.done);
    const weightTotal = requirements.reduce((a, r) => a + r.weight, 0);
    const weightDone = completed.reduce((a, r) => a + r.weight, 0);
    const percent = weightTotal === 0 ? 100 : Math.round((weightDone / weightTotal) * 100);
    const mandatoryPending = remaining.filter((r) => r.mandatory);
    const eligible = requirements.length > 0 && mandatoryPending.length === 0 && percent >= 85;

    const readiness = deriveReadiness({
      percent,
      hasNext: Boolean(ev?.next_rank_key),
      mandatoryPending: mandatoryPending.length,
      qualifyingLast3,
      daysInRank,
    });

    return {
      staff: { id: staff.id, name: staff.name, role: staff.role },
      identity_id: identity?.id ?? null,
      current_rank_key: ev?.current_rank_key ?? staff.current_rank_key ?? null,
      current_rank_name: ev?.current_rank_name ?? null,
      next_rank_key: ev?.next_rank_key ?? null,
      next_rank_name: ev?.next_rank_name ?? null,
      percent,
      eligible,
      days_in_rank: daysInRank,
      requirements,
      completed,
      remaining,
      readiness,
      history: promotionHistory,
      totals: {
        total_stars: Number(ev?.total_stars ?? 0),
        a_grades: Number(ev?.a_grades ?? 0),
        b_grades: Number(ev?.b_grades ?? 0),
        unique_achievements: Number(ev?.unique_achievements ?? 0),
      },
      scores: {
        overall_avg_3mo: overallAvg !== null ? Math.round(overallAvg * 10) / 10 : null,
        latest_grade: latestGrade,
        qualifying_last3: qualifyingLast3,
        approved_claims: approvedClaims,
      },
    } satisfies PromotionProgress;
  });

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function empty(): PromotionProgress {
  return {
    staff: null,
    identity_id: null,
    current_rank_key: null,
    current_rank_name: null,
    next_rank_key: null,
    next_rank_name: null,
    percent: 0,
    eligible: false,
    days_in_rank: null,
    requirements: [],
    completed: [],
    remaining: [],
    readiness: { label: "Early", tone: "info", eta_months: null, note: "No profile linked yet." },
    history: [],
    totals: { total_stars: 0, a_grades: 0, b_grades: 0, unique_achievements: 0 },
    scores: { overall_avg_3mo: null, latest_grade: null, qualifying_last3: 0, approved_claims: 0 },
  };
}

function readHistory(state: any): PromotionEntry[] {
  if (!state || typeof state !== "object") return [];
  const raw = Array.isArray(state.history) ? state.history : [];
  return raw
    .filter((h: any) => h && h.to_rank_key && h.promoted_at)
    .map((h: any) => ({
      from_rank_key: h.from_rank_key ?? null,
      from_rank_name: h.from_rank_name ?? null,
      to_rank_key: String(h.to_rank_key),
      to_rank_name: String(h.to_rank_name ?? h.to_rank_key),
      promoted_at: String(h.promoted_at),
      source: String(h.source ?? "system"),
    }))
    .sort((a: PromotionEntry, b: PromotionEntry) => (a.promoted_at < b.promoted_at ? 1 : -1));
}

function deriveReadiness(args: {
  percent: number;
  hasNext: boolean;
  mandatoryPending: number;
  qualifyingLast3: number;
  daysInRank: number | null;
}): PromotionProgress["readiness"] {
  if (!args.hasNext) {
    return { label: "Max", tone: "gold", eta_months: null, note: "Top of the ladder. New horizons open beyond." };
  }
  if (args.percent >= 100 && args.mandatoryPending === 0) {
    return { label: "Ready", tone: "ok", eta_months: 0, note: "All requirements met. Awaiting Director approval." };
  }
  if (args.percent >= 66) {
    // Estimate: if 2 qualifying reviews per 3 months, ~1 A/B grade needed per month gap.
    const eta = Math.max(1, Math.ceil((100 - args.percent) / 15));
    return { label: "Near", tone: "warn", eta_months: eta, note: `Approx. ${eta} month${eta > 1 ? "s" : ""} at current pace.` };
  }
  if (args.percent >= 33) {
    return { label: "Building", tone: "info", eta_months: null, note: "Steady growth. Keep stacking qualifying months." };
  }
  return { label: "Early", tone: "info", eta_months: null, note: "New journey. Focus on consistent monthly grades." };
}
