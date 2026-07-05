import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { useRole, can } from "@/lib/roles";
import { listStaff } from "@/lib/config.functions";

export const Route = createFileRoute("/professional-performance")({
  head: () => ({
    meta: [
      { title: "Monthly Review — Odyssey" },
      {
        name: "description",
        content:
          "One monthly review per team member. Enter sales, judge behaviour, and the system calculates the final monthly performance automatically.",
      },
    ],
  }),
  component: () => (
    <AuthGate>
      <MonthlyReviewPage />
    </AuthGate>
  ),
});

// -------------------------------------------------------------------
// Fixed configuration
// -------------------------------------------------------------------

// Prototype V1: fixed monthly sales target for all Hunters.
// Future: promote to an Admin setting; still not editable on this page.
const MONTHLY_SALES_TARGET = 50000;

const CURRENCY = "RM";
function fmtMoney(n: number) {
  return `${CURRENCY}${n.toLocaleString()}`;
}

// -------------------------------------------------------------------
// Behaviour tiers — 5 fixed choices, shared by every category.
// Managers judge behaviour; internal scores are hidden from the UI.
// -------------------------------------------------------------------

type TierKey = "nsi" | "below" | "meets" | "exceeds" | "role";

type Tier = { key: TierKey; label: string; score: number };

const TIERS: Tier[] = [
  { key: "nsi",     label: "Needs Significant Improvement", score: 20 },
  { key: "below",   label: "Below Expectations",            score: 40 },
  { key: "meets",   label: "Meets Expectations",            score: 60 },
  { key: "exceeds", label: "Exceeds Expectations",          score: 80 },
  { key: "role",    label: "Role Model",                    score: 100 },
];

// -------------------------------------------------------------------
// Review Template registry (FROZEN ARCHITECTURE)
//
// Every Class in Odyssey owns its own Review Template. The manager only
// picks the employee; the system loads the correct template based on the
// employee's assigned Class (staff.primary_role, falling back to
// primary_class). The calculation engine is shared, but review content
// (behaviour categories, references, KPI logic) is NEVER shared between
// Classes. New Classes are added by registering a new template here —
// existing templates must not be modified to fit new ones.
// -------------------------------------------------------------------

type CategoryKey = string;

type ReviewCategory = {
  key: CategoryKey;
  label: string;
  description: string;
  behaviourExamples: string[];
};

type ObjectiveKPI =
  | {
      kind: "sales_vs_target";
      label: string;
      inputLabel: string;
      monthlyTarget: number;
      targetNote: string;
    }
  | { kind: "none" };

type ReviewTemplate = {
  id: string;              // e.g. "hunter_review_v1"
  classKey: string;        // matches staff.primary_role or primary_class slug
  className: string;       // display name (Hunter, Vanguard, ...)
  behaviourWeight: number; // 0..1 (share of final score)
  objective: ObjectiveKPI;
  referenceNote: string;
  categories: ReviewCategory[];
};

const HUNTER_TEMPLATE: ReviewTemplate = {
  id: "hunter_review_v1",
  classKey: "hunter",
  className: "Hunter",
  behaviourWeight: 0.5,
  objective: {
    kind: "sales_vs_target",
    label: "Sales",
    inputLabel: "Sales this month",
    monthlyTarget: 50000,
    targetNote: "fixed for all Hunters",
  },
  referenceNote:
    "Choose the ONE description that best represents the employee's overall behaviour throughout the month. The examples below are references, not items to count.",
  categories: [
    {
      key: "customer",
      label: "Customer Relationship",
      description:
        "Builds genuine customer relationships and consistently delivers excellent customer experiences.",
      behaviourExamples: [
        "Greets customers professionally.",
        "Understands customer preferences.",
        "Follows up with customers.",
        "Creates memorable customer experiences.",
        "Builds customer trust.",
      ],
    },
    {
      key: "communication",
      label: "Communication & Collaboration",
      description: "Communicates effectively and works well with the team.",
      behaviourExamples: [
        "Communicates clearly.",
        "Supports teammates.",
        "Shares information proactively.",
        "Cooperates across departments.",
        "Maintains a positive team attitude.",
      ],
    },
    {
      key: "execution",
      label: "Execution",
      description:
        "Executes responsibilities consistently with discipline and reliability.",
      behaviourExamples: [
        "Completes assigned tasks.",
        "Follows SOP consistently.",
        "Takes initiative without supervision.",
        "Responds quickly to operational needs.",
        "Demonstrates accountability.",
      ],
    },
    {
      key: "growth",
      label: "Growth to Influence",
      description:
        "Continuously improves oneself and positively influences others.",
      behaviourExamples: [
        "Learns actively.",
        "Accepts feedback positively.",
        "Applies improvements consistently.",
        "Shares knowledge with teammates.",
        "Positively influences others through actions.",
      ],
    },
  ],
};

// Register templates here. Only add — never rewrite an existing one to fit
// a new Class. Missing Classes intentionally render an "under development"
// placeholder so nobody is evaluated with the wrong form.
const TEMPLATES: Record<string, ReviewTemplate> = {
  hunter: HUNTER_TEMPLATE,
};

// Classes recognised by Odyssey but without a template yet. Anything not
// listed here AND not in TEMPLATES falls back to the same placeholder.
const KNOWN_CLASSES_WITHOUT_TEMPLATE: Record<string, string> = {
  vanguard:  "Vanguard",
  alchemist: "Alchemist",
  mage:      "Mage",
  navigator: "Navigator",
  sentinel:  "Sentinel",
  artisan:   "Artisan",
};

function normaliseClassKey(v: string | null | undefined): string {
  return (v ?? "").toString().trim().toLowerCase().replace(/\s+/g, "_");
}

function resolveTemplate(staff: any): {
  template: ReviewTemplate | null;
  className: string | null;
} {
  const roleKey = normaliseClassKey(staff?.primary_role);
  const classKey = normaliseClassKey(staff?.primary_class);
  const candidates = [roleKey, classKey].filter(Boolean);
  for (const k of candidates) {
    if (TEMPLATES[k]) return { template: TEMPLATES[k], className: TEMPLATES[k].className };
  }
  for (const k of candidates) {
    if (KNOWN_CLASSES_WITHOUT_TEMPLATE[k]) {
      return { template: null, className: KNOWN_CLASSES_WITHOUT_TEMPLATE[k] };
    }
  }
  return { template: null, className: candidates[0] ? candidates[0] : null };
}


// -------------------------------------------------------------------
// Grading
// -------------------------------------------------------------------

function gradeFor(score: number): { grade: "A" | "B" | "C" | "D"; label: string; color: string } {
  if (score >= 85) return { grade: "A", label: "Outstanding", color: "#F5D07A" };
  if (score >= 70) return { grade: "B", label: "Strong", color: "#B8D4E3" };
  if (score >= 55) return { grade: "C", label: "Steady", color: "#C8CDD4" };
  return { grade: "D", label: "Needs Recovery", color: "#E07070" };
}

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// -------------------------------------------------------------------
// LocalStorage draft (prototype only)
// -------------------------------------------------------------------

type Selections = Record<string, TierKey | null>;

function blankSelections(template: ReviewTemplate | null): Selections {
  const s: Selections = {};
  if (template) for (const c of template.categories) s[c.key] = null;
  return s;
}


type Submitted = {
  at: string;
  salesAmount: number;
  salesTarget: number;
  salesScore: number;
  behaviourScore: number;
  finalScore: number;
  grade: "A" | "B" | "C" | "D";
};

type Draft = {
  salesAmount: number;
  selections: Selections;
  notes: string;
  submitted?: Submitted;
};

const STORAGE_KEY = "odyssey.prototype.monthly-review.v1";

function loadDraft(staffId: string, month: string, template: ReviewTemplate | null): Draft {
  const blank: Draft = { salesAmount: 0, selections: blankSelections(template), notes: "" };

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
// Page
// -------------------------------------------------------------------

function MonthlyReviewPage() {
  const { role } = useRole();
  const canReview = can(role, "evaluations.write");

  const [month, setMonth] = useState(monthKey());
  const [staffId, setStaffId] = useState<string>("");
  const [salesAmount, setSalesAmount] = useState<number>(0);
  const [selections, setSelections] = useState<Selections>({});
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
  const { template, className } = useMemo(
    () => (selectedStaff ? resolveTemplate(selectedStaff) : { template: null, className: null }),
    [selectedStaff],
  );

  useEffect(() => {
    if (!staffId) {
      setSalesAmount(0);
      setSelections({});
      setNotes("");
      setResult(undefined);
      return;
    }
    const d = loadDraft(staffId, month, template);
    setSalesAmount(d.salesAmount);
    setSelections({ ...blankSelections(template), ...d.selections });
    setNotes(d.notes);
    setResult(d.submitted);
  }, [staffId, month, template?.id]);

  const allBehaviourSelected = useMemo(
    () => !!template && template.categories.every((c) => selections[c.key] != null),
    [selections, template],
  );
  const hasSalesKPI = template?.objective.kind === "sales_vs_target";
  const salesTarget =
    template?.objective.kind === "sales_vs_target" ? template.objective.monthlyTarget : 0;
  const salesReady = !hasSalesKPI || salesAmount > 0;
  const canSubmit = Boolean(staffId) && !!template && salesReady && allBehaviourSelected;

  function selectTier(key: CategoryKey, tier: TierKey) {
    setSelections((s) => ({ ...s, [key]: tier }));
  }

  function handleSubmit() {
    if (!canSubmit || !template) return;

    const behaviourScore =
      template.categories.reduce((sum, c) => {
        const tierKey = selections[c.key] as TierKey;
        const tier = TIERS.find((t) => t.key === tierKey)!;
        return sum + tier.score;
      }, 0) / template.categories.length;

    const salesScore = hasSalesKPI
      ? Math.min(100, Math.round((salesAmount / salesTarget) * 100))
      : 0;

    const bw = template.behaviourWeight;
    const finalScore = hasSalesKPI
      ? +(behaviourScore * bw + salesScore * (1 - bw)).toFixed(2)
      : +behaviourScore.toFixed(2);
    const g = gradeFor(finalScore);

    const submitted: Submitted = {
      at: new Date().toISOString(),
      salesAmount,
      salesTarget,
      salesScore,
      behaviourScore: +behaviourScore.toFixed(2),
      finalScore,
      grade: g.grade,
    };
    setResult(submitted);
    saveDraft(staffId, month, { salesAmount, selections, notes, submitted });
  }

  function handleReset() {
    setSalesAmount(0);
    setSelections(blankSelections(template));
    setNotes("");
    setResult(undefined);
  }

  const templateLabel = template
    ? `${template.className} · ${template.id}`
    : className
    ? `${className} · template pending`
    : "Prototype V1";

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.35em] text-gold/70">
              {templateLabel}
            </div>
            <h1 className="font-display text-xl font-semibold uppercase tracking-widest text-gold">
              Monthly Review
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              Manager observes. Manager judges behaviour. System calculates. The review
              form is loaded automatically from the employee's Class template.
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
            Only Managers and Directors can complete a Monthly Review.
          </div>
        ) : (
          <>
            {/* Team member + month */}
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

            {/* No staff selected yet */}
            {!staffId && (
              <div className="rounded-md border border-dashed border-border bg-ink/20 p-6 text-center text-xs text-muted-foreground">
                Select a team member to load their Class review template.
              </div>
            )}

            {/* Staff selected but no template registered for their Class */}
            {staffId && !template && (
              <div className="rounded-md border border-amber-400/50 bg-amber-400/5 p-6 text-center">
                <div className="font-display text-sm uppercase tracking-[0.25em] text-amber-200">
                  {className ? `${className} Review Template` : "Class Review Template"} is under development
                </div>
                <p className="mt-3 text-xs text-amber-100/80">
                  This employee cannot be reviewed until the template becomes available.
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Every Class in Odyssey has its own unique review template. Do not use
                  another Class's form.
                </p>
              </div>
            )}

            {/* Template loaded — render review */}
            {staffId && template && (
              <>
                {/* Step 1 — Objective KPI */}
                {template.objective.kind === "sales_vs_target" && (
                  <section className="mb-6 rounded-md border border-border bg-ink/30 p-5">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded-full border border-gold/50 px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.25em] text-gold">
                        Step 1
                      </span>
                      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">
                        {template.objective.label}
                      </h2>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter the team member's total sales this month. The monthly target
                      is set by the {template.className} template.
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                          {template.objective.inputLabel} ({CURRENCY})
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
                          Monthly Sales Target
                        </div>
                        <div className="flex items-center gap-2 rounded-md border border-border/60 bg-black/20 px-3 py-2 text-sm">
                          <span className="font-display text-gold">
                            {fmtMoney(template.objective.monthlyTarget)}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            · {template.objective.targetNote}
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Step 2 — Behaviour */}
                <section className="mb-6">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-full border border-gold/50 px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.25em] text-gold">
                      {template.objective.kind === "none" ? "Step 1" : "Step 2"}
                    </span>
                    <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">
                      Behaviour
                    </h2>
                  </div>
                  <p className="mb-4 text-xs text-muted-foreground">
                    For each category, select the one description that best represents the
                    team member's overall behaviour throughout the month.
                  </p>
                  <div className="space-y-4">
                    {template.categories.map((cat) => (
                      <CategoryCard
                        key={cat.key}
                        category={cat}
                        referenceNote={template.referenceNote}
                        selectedTier={selections[cat.key] ?? null}
                        onSelect={(t) => selectTier(cat.key, t)}
                      />
                    ))}
                  </div>
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
                    Optional. Use only for exceptional performance, serious performance
                    issues, or important incidents requiring documentation. Leave blank
                    for a normal month.
                  </p>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional — only for exceptional, serious, or incident-related situations."
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
                        ? "Review already submitted for this month. Adjust and resubmit if needed."
                        : canSubmit
                        ? "Ready to submit. The system will calculate everything automatically."
                        : hasSalesKPI && !salesReady
                        ? "Enter this month's sales figure to continue."
                        : "Select a behaviour rating in every category."}
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
                        disabled={!canSubmit}
                        className="rounded-md border border-gold bg-gold/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-gold hover:bg-gold/20 disabled:opacity-50"
                      >
                        {result ? "Resubmit Review" : "Submit Monthly Review"}
                      </button>
                    </div>
                  </div>

                  {result && <ResultPanel result={result} hasSalesKPI={hasSalesKPI} />}
                </section>

                <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Prototype only · saved to this device · calculation preview
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}


// -------------------------------------------------------------------
// Category card — 5 tier radios + reference-only behaviour examples
// -------------------------------------------------------------------

function CategoryCard({
  category,
  referenceNote,
  selectedTier,
  onSelect,
}: {
  category: ReviewCategory;
  referenceNote: string;
  selectedTier: TierKey | null;
  onSelect: (tier: TierKey) => void;
}) {

  return (
    <article className="rounded-md border border-border bg-ink/30 p-5">
      <header>
        <h3 className="font-display text-sm uppercase tracking-[0.25em] text-gold">
          {category.label}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{category.description}</p>
      </header>

      <ul className="mt-4 space-y-2">
        {TIERS.map((tier) => {
          const active = selectedTier === tier.key;
          return (
            <li key={tier.key}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(tier.key)}
                aria-pressed={active}
                className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition disabled:opacity-50 ${
                  active
                    ? "border-gold bg-gold/10 text-foreground"
                    : "border-border bg-black/20 text-muted-foreground hover:border-gold/40 hover:text-foreground"
                }`}
              >
                <span
                  className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    active ? "border-gold" : "border-border"
                  }`}
                >
                  {active && <span className="h-2 w-2 rounded-full bg-gold" />}
                </span>
                <span className="flex-1">{tier.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-md border border-border/60 bg-black/20 p-3">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-gold/70">
          Behaviour Reference
        </div>
        <p className="mb-2 text-[11px] italic text-muted-foreground">{REFERENCE_NOTE}</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {category.behaviourExamples.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-gold/60">◇</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

// -------------------------------------------------------------------
// Result panel — revealed only after Submit
// -------------------------------------------------------------------

function ResultPanel({ result }: { result: Submitted }) {
  const g = gradeFor(result.finalScore);
  const targetPct = Math.round((result.salesAmount / result.salesTarget) * 100);
  return (
    <div className="mt-5 space-y-4 border-t border-gold/30 pt-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Sales Score"
          value={result.salesScore}
          suffix={`/ 100 · ${fmtMoney(result.salesAmount)} of ${fmtMoney(result.salesTarget)} (${targetPct}%)`}
        />
        <Stat label="Behaviour Score" value={result.behaviourScore} suffix="/ 100" />
        <Stat label="Final Performance" value={result.finalScore} suffix="/ 100" accent />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div
          className="rounded-md border p-3 text-center"
          style={{ borderColor: g.color }}
        >
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Monthly Grade
          </div>
          <div
            className="mt-1 font-display text-2xl font-bold"
            style={{ color: g.color }}
          >
            {g.grade}
          </div>
          <div
            className="text-[10px] uppercase tracking-widest"
            style={{ color: g.color }}
          >
            {g.label}
          </div>
        </div>

        <PlaceholderStat
          label="Rolling Performance"
          value="—"
          hint="12-month engine · not connected in prototype"
        />
        <PlaceholderStat
          label="Promotion Progress"
          value="—"
          hint="Promotion engine · not connected in prototype"
        />
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
  value: number;
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
      <div
        className={`mt-1 font-display text-2xl ${accent ? "text-gold" : "text-foreground"}`}
      >
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

function PlaceholderStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-border/70 bg-black/20 p-3 text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl text-muted-foreground">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {hint}
      </div>
    </div>
  );
}
