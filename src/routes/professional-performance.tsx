import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AuthGate } from "@/components/auth-gate";
import { useRole, can } from "@/lib/roles";
import { listStaff } from "@/lib/config.functions";
import { submitMonthlyReview } from "@/lib/reviews.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/professional-performance")({
  head: () => ({
    meta: [
      { title: "Performance Review — Odyssey" },
      {
        name: "description",
        content:
          "Class Performance plus Guild Performance. Managers judge observable behaviour with stars; the system calculates the monthly grade.",
      },
      { property: "og:title", content: "Performance Review — Odyssey" },
      {
        property: "og:description",
        content:
          "50% Class Performance + 50% Guild Performance across four frozen behaviour dimensions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AuthGate>
      <MonthlyReviewPage />
    </AuthGate>
  ),
});

// ===================================================================
// FROZEN SPECIFICATION
// Total Performance = 100 points
//   Class Performance  = 50 points (Hunter: Sales)
//   Guild Performance  = 50 points (4 behaviour dimensions × 12.5)
// Behaviour rating: 1-5 stars (20% per star). 3 stars = Meets Standard.
// 0 stars is reserved for exceptional cases (no participation / no evidence).
// ===================================================================

const CLASS_MAX = 50;
const GUILD_MAX = 50;
const BEHAVIOUR_MAX = 12.5; // per dimension

const CURRENCY = "RM";
function fmtMoney(n: number) {
  return `${CURRENCY}${n.toLocaleString()}`;
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}

// -------------------------------------------------------------------
// Guild Performance — four frozen behaviour dimensions
// -------------------------------------------------------------------

type BehaviourKey = "professionalism" | "culture" | "service_excellence" | "teamwork";

type Behaviour = {
  key: BehaviourKey;
  label: string;
  group: "Internal" | "External";
  description: string;
};

const BEHAVIOURS: Behaviour[] = [
  {
    key: "professionalism",
    label: "Professionalism",
    group: "Internal",
    description:
      "Self-discipline, professional standards, job knowledge, work discipline, responsibility and professional execution.",
  },
  {
    key: "culture",
    label: "Culture",
    group: "Internal",
    description:
      "Voluntary participation, learning, practising and maintaining Guild culture and values.",
  },
  {
    key: "service_excellence",
    label: "Service Excellence",
    group: "External",
    description:
      "Observable behaviour related to service quality and service standards.",
  },
  {
    key: "teamwork",
    label: "Teamwork",
    group: "External",
    description:
      "Observable behaviour related to communication, cooperation, support, coordination and working with others.",
  },
];

const STAR_MEANING: Record<number, string> = {
  0: "Exceptional case — no participation, no completion, or no applicable evidence.",
  1: "20% — far below standard behaviour observed.",
  2: "40% — below standard behaviour observed.",
  3: "60% — Meets Standard.",
  4: "80% — above standard behaviour observed.",
  5: "100% — consistently exemplary behaviour observed.",
};

// -------------------------------------------------------------------
// Class Performance templates (one per Class)
// -------------------------------------------------------------------

type ClassTemplate = {
  id: string;
  classKey: string;
  className: string;
  classMetric: "sales" | "none";
  metricLabel: string;
  inputLabel: string;
  monthlyTarget: number;
  targetNote: string;
};

const HUNTER_TEMPLATE: ClassTemplate = {
  id: "hunter_review_v2",
  classKey: "hunter",
  className: "Hunter",
  classMetric: "sales",
  metricLabel: "Sales",
  inputLabel: "Sales this month",
  monthlyTarget: 50000,
  targetNote: "fixed for all Hunters",
};

const WARRIOR_TEMPLATE: ClassTemplate = {
  id: "warrior_review_v2",
  classKey: "warrior",
  className: "Warrior",
  classMetric: "sales",
  metricLabel: "Sales",
  inputLabel: "Sales this month",
  monthlyTarget: 50000,
  targetNote: "temporary placeholder — Warrior class metric pending final design",
};

const TEMPLATES: Record<string, ClassTemplate> = {
  hunter: HUNTER_TEMPLATE,
  warrior: WARRIOR_TEMPLATE,
};

// Recognised Classes without a template yet.
const KNOWN_CLASSES_WITHOUT_TEMPLATE: Record<string, string> = {
  tanker: "Vanguard",
  vanguard: "Vanguard",
  alchemist: "Alchemist",
  mage: "Mage",
  navigator: "Navigator",
  sentinel: "Sentinel",
  artisan: "Artisan",
};

function normaliseClassKey(v: string | null | undefined): string {
  return (v ?? "").toString().trim().toLowerCase().replace(/\s+/g, "_");
}

type ResolveResult = {
  status: "ok" | "pending" | "missing";
  template: ClassTemplate | null;
  className: string | null;
  classKey: string | null;
};

/** Class comes from staff.primary_role — never guessed, never substituted. */
function resolveTemplate(staff: any): ResolveResult {
  const classKey = normaliseClassKey(staff?.primary_role);
  if (!classKey) return { status: "missing", template: null, className: null, classKey: null };
  const t = TEMPLATES[classKey];
  if (t) return { status: "ok", template: t, className: t.className, classKey };
  const known = KNOWN_CLASSES_WITHOUT_TEMPLATE[classKey];
  return {
    status: "pending",
    template: null,
    className:
      known ?? classKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    classKey,
  };
}

// -------------------------------------------------------------------
// Grading (frozen thresholds)
// -------------------------------------------------------------------

function gradeFor(total: number): {
  grade: "A" | "B" | "C" | "D";
  label: string;
  color: string;
} {
  if (total >= 90) return { grade: "A", label: "Alpha", color: "#F5D07A" };
  if (total >= 80) return { grade: "B", label: "Beta", color: "#B8D4E3" };
  if (total >= 60) return { grade: "C", label: "Certified", color: "#C8CDD4" };
  return { grade: "D", label: "Below Standard", color: "#E07070" };
}

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// -------------------------------------------------------------------
// Draft storage (prototype)
// -------------------------------------------------------------------

type Stars = Record<BehaviourKey, number | null>;

function blankStars(): Stars {
  return {
    professionalism: null,
    culture: null,
    service_excellence: null,
    teamwork: null,
  };
}

type Submitted = {
  at: string;
  salesAmount: number;
  salesTarget: number;
  classPoints: number;
  guildPoints: number;
  total: number;
  grade: "A" | "B" | "C" | "D";
  perBehaviour: { key: BehaviourKey; label: string; stars: number; pct: number; points: number }[];
};

type Draft = {
  salesAmount: number;
  stars: Stars;
  notes: string;
  submitted?: Submitted;
};

const STORAGE_KEY = "odyssey.prototype.performance-review.v2";

function loadDraft(staffId: string, month: string): Draft {
  const blank: Draft = { salesAmount: 0, stars: blankStars(), notes: "" };
  if (typeof window === "undefined") return blank;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return blank;
    const all = JSON.parse(raw) as Record<string, Draft>;
    return all[`${staffId}::${month}`] ?? blank;
  } catch {
    return blank;
  }
}

function saveDraft(staffId: string, month: string, draft: Draft) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, Draft>) : {};
    all[`${staffId}::${month}`] = draft;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

// -------------------------------------------------------------------
// Calculation engine (pure)
// -------------------------------------------------------------------

function classPointsFromSales(amount: number, target: number) {
  if (!target) return 0;
  return round1(Math.min(1, amount / target) * CLASS_MAX);
}

function behaviourPoints(stars: number) {
  return round1((stars / 5) * BEHAVIOUR_MAX);
}

// -------------------------------------------------------------------
// Page
// -------------------------------------------------------------------

function MonthlyReviewPage() {
  const { role } = useRole();
  const canReview = can(role, "evaluations.write");
  const queryClient = useQueryClient();
  const submitReview = useServerFn(submitMonthlyReview);
  const [saving, setSaving] = useState(false);

  const [month, setMonth] = useState(monthKey());
  const [staffId, setStaffId] = useState<string>("");
  const [salesAmount, setSalesAmount] = useState<number>(0);
  const [stars, setStars] = useState<Stars>(blankStars());
  const [notes, setNotes] = useState<string>("");
  const [result, setResult] = useState<Submitted | undefined>();

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => listStaff(),
    enabled: canReview,
  });

  const selectedStaff = useMemo(
    () => (staff as any[]).find((s: any) => s.id === staffId) ?? null,
    [staff, staffId],
  );
  const resolved = useMemo<ResolveResult>(
    () =>
      selectedStaff
        ? resolveTemplate(selectedStaff)
        : { status: "missing", template: null, className: null, classKey: null },
    [selectedStaff],
  );
  const { template, className } = resolved;

  useEffect(() => {
    if (!staffId) {
      setSalesAmount(0);
      setStars(blankStars());
      setNotes("");
      setResult(undefined);
      return;
    }
    const d = loadDraft(staffId, month);
    setSalesAmount(d.salesAmount);
    setStars({ ...blankStars(), ...d.stars });
    setNotes(d.notes);
    setResult(d.submitted);
  }, [staffId, month]);

  const hasSalesMetric = template?.classMetric === "sales";
  const salesTarget = template?.monthlyTarget ?? 0;
  const allRated = BEHAVIOURS.every((b) => stars[b.key] != null);
  const salesReady = !hasSalesMetric || salesAmount > 0;
  const canSubmit = Boolean(staffId) && !!template && salesReady && allRated;

  async function handleSubmit() {
    if (!canSubmit || !template || saving) return;

    const perBehaviour = BEHAVIOURS.map((b) => {
      const s = stars[b.key] ?? 0;
      return {
        key: b.key,
        label: b.label,
        stars: s,
        pct: s * 20,
        points: behaviourPoints(s),
      };
    });

    const guildPoints = round1(perBehaviour.reduce((sum, b) => sum + b.points, 0));
    const classPoints = hasSalesMetric ? classPointsFromSales(salesAmount, salesTarget) : 0;
    const total = round1(classPoints + guildPoints);
    const g = gradeFor(total);

    const submitted: Submitted = {
      at: new Date().toISOString(),
      salesAmount,
      salesTarget,
      classPoints,
      guildPoints,
      total,
      grade: g.grade,
      perBehaviour,
    };

    setSaving(true);
    try {
      await submitReview({
        data: {
          staff_id: staffId,
          month,
          sales_amount: salesAmount,
          sales_target: salesTarget,
          class_points: classPoints,
          guild_points: guildPoints,
          final_score: total,
          grade: g.grade,
          professionalism: (stars.professionalism ?? 0) * 20,
          culture: (stars.culture ?? 0) * 20,
          service_excellence: (stars.service_excellence ?? 0) * 20,
          teamwork: (stars.teamwork ?? 0) * 20,
          notes,
        },
      });
      setResult(submitted);
      saveDraft(staffId, month, { salesAmount, stars, notes, submitted });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["peer-insights"] }),
        queryClient.invalidateQueries({ queryKey: ["staff"] }),
        queryClient.invalidateQueries({ queryKey: ["promotion-progress"] }),
        queryClient.invalidateQueries({ queryKey: ["team-promotions"] }),
        queryClient.invalidateQueries({ queryKey: ["ranking-history", staffId] }),
      ]);
      toast.success(`Review saved · Grade ${g.grade}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save review");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setSalesAmount(0);
    setStars(blankStars());
    setNotes("");
    setResult(undefined);
  }

  const templateLabel = template
    ? `${template.className} · ${template.id}`
    : className
    ? `${className} · template pending`
    : "Odyssey Performance System";

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.35em] text-gold/70">
              {templateLabel}
            </div>
            <h1 className="font-display text-xl font-semibold uppercase tracking-widest text-gold">
              Performance Review
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              50% Class Performance + 50% Guild Performance. Managers judge observable
              behaviour. The system calculates the monthly result.
            </p>
          </div>
          <Link
            to="/"
            className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
          >
            ← Dashboard
          </Link>
        </header>

        {!canReview ? (
          <div className="rounded-md border border-border bg-ink/30 p-5 text-xs text-muted-foreground">
            Only Managers and Directors can complete a Performance Review.
          </div>
        ) : (
          <>
            <section className="mb-6 grid gap-3 rounded-md border border-border bg-ink/30 p-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Team Member
                </span>
                <select
                  className="w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                >
                  <option value="">— Select team member —</option>
                  {(staff as any[]).map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.role}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Month
                </span>
                <input
                  type="month"
                  className="w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </label>
            </section>

            {!staffId && (
              <div className="rounded-md border border-dashed border-border bg-ink/20 p-6 text-center text-xs text-muted-foreground">
                Select a team member to load their Class review template.
              </div>
            )}

            {staffId && resolved.status === "missing" && (
              <div className="rounded-md border border-red-500/60 bg-red-500/5 p-6 text-center">
                <div className="font-display text-sm uppercase tracking-[0.25em] text-red-300">
                  Class not set for {selectedStaff?.name ?? "this employee"}
                </div>
                <p className="mt-3 text-xs text-red-100/80">
                  Cannot load a review — this employee has no Class recorded.
                </p>
              </div>
            )}

            {staffId && resolved.status === "pending" && (
              <div className="rounded-md border border-amber-400/50 bg-amber-400/5 p-6 text-center">
                <div className="font-display text-sm uppercase tracking-[0.25em] text-amber-200">
                  {className} Class Performance is under development
                </div>
                <p className="mt-3 text-xs text-amber-100/80">
                  Guild Performance is standard for every Class, but the {className} Class
                  Performance metric has not been defined yet.
                </p>
              </div>
            )}

            {staffId && template && (
              <>
                {/* 1 — CLASS PERFORMANCE */}
                <section className="mb-6 rounded-md border border-border bg-ink/30 p-5">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-gold/50 px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.25em] text-gold">
                      1
                    </span>
                    <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">
                      Class Performance · {template.metricLabel}
                    </h2>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      max {CLASS_MAX} points
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {template.metricLabel} is the core performance of the {template.className}{" "}
                    Class. Enter the figure — the system converts it to points.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                        {template.inputLabel} ({CURRENCY})
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={salesAmount || ""}
                        placeholder="0"
                        onChange={(e) =>
                          setSalesAmount(Math.max(0, Number(e.target.value) || 0))
                        }
                        className="w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none"
                      />
                    </label>
                    <div className="block">
                      <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                        Monthly Target
                      </div>
                      <div className="flex items-center gap-2 rounded-md border border-border/60 bg-black/20 px-3 py-2 text-sm">
                        <span className="font-display text-gold">
                          {fmtMoney(template.monthlyTarget)}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          · {template.targetNote}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2 — GUILD PERFORMANCE */}
                <section className="mb-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-gold/50 px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.25em] text-gold">
                      2
                    </span>
                    <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">
                      Guild Performance
                    </h2>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      max {GUILD_MAX} points · 4 × {BEHAVIOUR_MAX}
                    </span>
                  </div>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Rate the behaviour this person actually demonstrated this month —
                    1 to 5 stars. 3 stars = Meets Standard. 0 is reserved for exceptional
                    cases with no participation or no applicable evidence.
                  </p>

                  {(["Internal", "External"] as const).map((group) => (
                    <div key={group} className="mb-4">
                      <div className="mb-2 font-display text-[10px] uppercase tracking-[0.3em] text-gold/60">
                        {group}
                      </div>
                      <div className="space-y-4">
                        {BEHAVIOURS.filter((b) => b.group === group).map((b) => (
                          <BehaviourCard
                            key={b.key}
                            behaviour={b}
                            stars={stars[b.key]}
                            onSelect={(v) => setStars((s) => ({ ...s, [b.key]: v }))}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </section>

                {/* Optional notes */}
                <section className="mb-6 rounded-md border border-border bg-ink/30 p-5">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-full border border-border px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      Optional
                    </span>
                    <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">
                      Manager Notes
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Optional. Use only for exceptional behaviour or incidents that require
                    documentation.
                  </p>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional — observable behaviour only."
                    className="mt-3 w-full resize-none rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none"
                  />
                </section>

                {/* Submit */}
                <section className="rounded-md border border-gold/30 bg-gold/5 p-5">
                  {result && (
                    <div className="mb-4 flex items-center gap-2 rounded-md border border-emerald-400/50 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
                      <span className="font-display uppercase tracking-widest">✓ Submitted</span>
                      <span className="text-emerald-100/80">
                        at {new Date(result.at).toLocaleTimeString()} · results below
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                      {result
                        ? "Review submitted for this month. Adjust and resubmit if needed."
                        : canSubmit
                        ? "Ready to submit. The system calculates everything automatically."
                        : hasSalesMetric && !salesReady
                        ? `Enter this month's ${template.metricLabel.toLowerCase()} figure to continue.`
                        : "Give a star rating to all four behaviour dimensions."}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleReset}
                        className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-red-400/40 hover:text-red-200"
                      >
                        Reset
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || saving}
                        className="rounded-md border border-gold bg-gold/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-gold hover:bg-gold/20 disabled:opacity-50"
                      >
                        {saving ? "Saving…" : result ? "Resubmit Review" : "Submit Performance Review"}
                      </button>
                    </div>
                  </div>

                  {result && <ResultPanel result={result} />}
                </section>

                {/* 5 — RANKING PROGRESS */}
                <RankingProgress staff={selectedStaff} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Behaviour card — 1-5 star selector
// -------------------------------------------------------------------

function BehaviourCard({
  behaviour,
  stars,
  onSelect,
}: {
  behaviour: Behaviour;
  stars: number | null;
  onSelect: (v: number) => void;
}) {
  const value = stars ?? 0;
  const pct = value * 20;
  const points = behaviourPoints(value);

  return (
    <article className="rounded-md border border-border bg-ink/30 p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-sm uppercase tracking-[0.25em] text-gold">
            {behaviour.label}
          </h3>
          <p className="mt-1 max-w-xl text-xs text-muted-foreground">
            {behaviour.description}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Max
          </div>
          <div className="font-display text-sm text-gold/80">{BEHAVIOUR_MAX} pts</div>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const on = stars != null && n <= stars;
            return (
              <button
                key={n}
                type="button"
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                aria-pressed={on}
                onClick={() => onSelect(n)}
                className={`text-2xl leading-none transition ${
                  on ? "text-gold" : "text-border hover:text-gold/50"
                }`}
              >
                ★
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => onSelect(0)}
          className={`rounded-md border px-2 py-1 text-[10px] uppercase tracking-widest transition ${
            stars === 0
              ? "border-red-400/60 bg-red-400/10 text-red-200"
              : "border-border text-muted-foreground hover:border-red-400/40 hover:text-red-200"
          }`}
        >
          0 · No evidence
        </button>

        {stars != null && (
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="rounded-md border border-border bg-black/20 px-2 py-1 text-muted-foreground">
              {pct}%
            </span>
            <span className="rounded-md border border-gold/40 bg-gold/10 px-2 py-1 font-display text-gold">
              {points} / {BEHAVIOUR_MAX} pts
            </span>
          </div>
        )}
      </div>

      <p className="mt-3 text-[11px] italic text-muted-foreground">
        {stars == null
          ? "Select the star rating that matches the behaviour actually demonstrated this month."
          : STAR_MEANING[stars]}
      </p>
    </article>
  );
}

// -------------------------------------------------------------------
// Result panel
// -------------------------------------------------------------------

function ResultPanel({ result }: { result: Submitted }) {
  const g = gradeFor(result.total);
  const targetPct = result.salesTarget
    ? Math.round((result.salesAmount / result.salesTarget) * 100)
    : 0;

  return (
    <div className="mt-5 space-y-4 border-t border-gold/30 pt-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Class Performance"
          value={`${result.classPoints} / ${CLASS_MAX}`}
          suffix={`${fmtMoney(result.salesAmount)} of ${fmtMoney(result.salesTarget)} · ${targetPct}%`}
        />
        <Stat label="Guild Performance" value={`${result.guildPoints} / ${GUILD_MAX}`} suffix="4 behaviour dimensions" />
        <Stat label="Total Performance" value={`${result.total} / 100`} accent />
      </div>

      <div className="rounded-md border border-border bg-ink/40 p-4">
        <div className="mb-3 font-display text-[10px] uppercase tracking-[0.3em] text-gold/70">
          Behaviour Contribution
        </div>
        <ul className="space-y-2">
          {result.perBehaviour.map((b) => (
            <li key={b.key} className="flex flex-wrap items-center gap-3 text-xs">
              <span className="w-40 text-muted-foreground">{b.label}</span>
              <span className="text-gold">{"★".repeat(b.stars)}{"☆".repeat(5 - b.stars)}</span>
              <span className="text-muted-foreground">{b.pct}%</span>
              <span className="ml-auto font-display text-foreground">
                {b.points} / {BEHAVIOUR_MAX} pts
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="rounded-md border p-4 text-center"
        style={{ borderColor: g.color }}
      >
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Final Grade
        </div>
        <div className="mt-1 font-display text-3xl font-bold" style={{ color: g.color }}>
          {g.grade}
        </div>
        <div className="text-[10px] uppercase tracking-widest" style={{ color: g.color }}>
          {g.label}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          A 90–100 · B 80–89 · C 60–79 · D below 60. Certified means the required
          standard for the current role has been met.
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-3 text-center ${
        accent ? "border-gold bg-gold/10" : "border-border bg-ink/40"
      }`}
    >
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 font-display text-2xl ${accent ? "text-gold" : "text-foreground"}`}>
        {value}
      </div>
      {suffix && (
        <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          {suffix}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// Ranking progress — Performance is an INPUT to Ranking, never equal to it
// -------------------------------------------------------------------

function RankingProgress({ staff }: { staff: any }) {
  const staffId = staff?.id as string | undefined;

  const { data } = useQuery({
    queryKey: ["ranking-history", staffId],
    enabled: !!staffId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_evaluations")
        .select("month, grade, composite_score")
        .eq("staff_id", staffId!)
        .order("month", { ascending: false })
        .limit(12);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const rows = data ?? [];
  const counts = rows.reduce<Record<string, number>>((acc, r: any) => {
    acc[r.grade] = (acc[r.grade] ?? 0) + 1;
    return acc;
  }, {});
  const avg = rows.length
    ? round1(rows.reduce((s, r: any) => s + Number(r.composite_score || 0), 0) / rows.length)
    : 0;

  return (
    <section className="mt-6 rounded-md border border-border bg-ink/30 p-5">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-gold/50 px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.25em] text-gold">
          3
        </span>
        <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">
          Ranking Progress
        </h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Performance is an input into Ranking. Rank represents long-term proven
        capability, not a single month's grade.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Current Rank" value={(staff?.current_rank_key ?? "—").toString().toUpperCase()} />
        <Stat label="Accumulated Reviews" value={String(rows.length)} suffix="last 12 months" />
        <Stat label="Average Performance" value={`${avg} / 100`} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(["A", "B", "C", "D"] as const).map((gr) => (
          <span
            key={gr}
            className="rounded-md border border-border bg-black/20 px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground"
          >
            {gr} × {counts[gr] ?? 0}
          </span>
        ))}
      </div>

      {rows.length > 0 && (
        <ul className="mt-4 space-y-1 text-xs">
          {rows.map((r: any) => (
            <li key={r.month} className="flex items-center gap-3">
              <span className="w-24 text-muted-foreground">{String(r.month).slice(0, 7)}</span>
              <span className="font-display text-gold">{r.grade}</span>
              <span className="ml-auto text-muted-foreground">
                {round1(Number(r.composite_score || 0))} / 100
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
