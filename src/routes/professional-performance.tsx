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
          "One monthly review per team member. Enter sales, select behaviour, and the system calculates the final monthly performance.",
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
// Behaviour categories — 5 predefined descriptions per category.
// Each option has an internal score. Managers pick one, never type numbers.
// Scores: 20 / 40 / 60 / 80 / 100 (equal steps, easy to reason about).
// -------------------------------------------------------------------

type CategoryKey = "customer" | "communication" | "execution" | "growth";

type BehaviourOption = { label: string; score: number };

type Category = {
  key: CategoryKey;
  label: string;
  description: string;
  options: BehaviourOption[]; // exactly 5, ordered lowest → highest
};

const CATEGORIES: Category[] = [
  {
    key: "customer",
    label: "Customer Relationship",
    description:
      "Builds genuine customer relationships and consistently delivers excellent customer experiences.",
    options: [
      { label: "Rarely builds customer relationships.", score: 20 },
      { label: "Occasionally builds customer trust.", score: 40 },
      { label: "Consistently provides good customer service.", score: 60 },
      { label: "Builds long-term customer loyalty.", score: 80 },
      {
        label:
          "Creates exceptional customer experiences and actively grows relationships.",
        score: 100,
      },
    ],
  },
  {
    key: "communication",
    label: "Communication & Collaboration",
    description: "Communicates effectively and works well with the team.",
    options: [
      { label: "Rarely communicates or cooperates with the team.", score: 20 },
      { label: "Communicates when prompted but seldom initiates.", score: 40 },
      { label: "Communicates clearly and supports teammates.", score: 60 },
      {
        label: "Proactively shares information and cooperates across departments.",
        score: 80,
      },
      {
        label:
          "Elevates team communication and sets the standard for collaboration.",
        score: 100,
      },
    ],
  },
  {
    key: "execution",
    label: "Execution",
    description:
      "Executes responsibilities consistently with discipline and reliability.",
    options: [
      { label: "Often misses tasks or requires reminders.", score: 20 },
      { label: "Completes tasks inconsistently.", score: 40 },
      { label: "Completes assigned tasks and follows SOP.", score: 60 },
      {
        label: "Takes initiative and responds quickly to operational needs.",
        score: 80,
      },
      {
        label:
          "Owns outcomes end-to-end and consistently raises operational standards.",
        score: 100,
      },
    ],
  },
  {
    key: "growth",
    label: "Growth to Influence",
    description:
      "Continuously improves oneself and positively influences others.",
    options: [
      { label: "Rarely learns or accepts feedback.", score: 20 },
      { label: "Occasionally applies feedback.", score: 40 },
      { label: "Learns actively and applies improvements.", score: 60 },
      { label: "Shares knowledge and supports teammates' growth.", score: 80 },
      {
        label: "Positively influences the whole team through actions and mentoring.",
        score: 100,
      },
    ],
  },
];

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

type Selections = Record<CategoryKey, number | null>; // index of selected option

const BLANK_SELECTIONS: Selections = {
  customer: null,
  communication: null,
  execution: null,
  growth: null,
};

type Draft = {
  salesAmount: number;
  salesTarget: number;
  selections: Selections;
  notes: string;
  submitted?: {
    at: string;
    behaviourScore: number;
    objectiveScore: number;
    finalScore: number;
    grade: string;
  };
};

const STORAGE_KEY = "odyssey.prototype.monthly-review.v1";

function loadDraft(staffId: string, month: string): Draft {
  const blank: Draft = {
    salesAmount: 0,
    salesTarget: 0,
    selections: { ...BLANK_SELECTIONS },
    notes: "",
  };
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
  const [salesTarget, setSalesTarget] = useState<number>(0);
  const [selections, setSelections] = useState<Selections>({ ...BLANK_SELECTIONS });
  const [notes, setNotes] = useState<string>("");
  const [result, setResult] = useState<Draft["submitted"]>();

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => listStaff(),
    enabled: canReview,
  });

  // Load draft on staff/month change
  useEffect(() => {
    if (!staffId) {
      setSalesAmount(0);
      setSalesTarget(0);
      setSelections({ ...BLANK_SELECTIONS });
      setNotes("");
      setResult(undefined);
      return;
    }
    const d = loadDraft(staffId, month);
    setSalesAmount(d.salesAmount);
    setSalesTarget(d.salesTarget);
    setSelections(d.selections);
    setNotes(d.notes);
    setResult(d.submitted);
  }, [staffId, month]);

  const allBehaviourSelected = useMemo(
    () => CATEGORIES.every((c) => selections[c.key] !== null),
    [selections],
  );

  const salesReady = salesTarget > 0;
  const canSubmit = Boolean(staffId) && salesReady && allBehaviourSelected;

  function selectOption(key: CategoryKey, optionIndex: number) {
    setSelections((s) => ({ ...s, [key]: optionIndex }));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    // Behaviour = average of 4 category scores
    const behaviour =
      CATEGORIES.reduce((sum, c) => {
        const idx = selections[c.key] as number;
        return sum + c.options[idx].score;
      }, 0) / CATEGORIES.length;

    // Objective = sales vs target, capped at 100
    const objective = Math.min(100, Math.round((salesAmount / salesTarget) * 100));

    // Final = 50/50
    const finalScore = +((behaviour + objective) / 2).toFixed(2);
    const gradeInfo = gradeFor(finalScore);

    const submitted = {
      at: new Date().toISOString(),
      behaviourScore: +behaviour.toFixed(2),
      objectiveScore: objective,
      finalScore,
      grade: gradeInfo.grade,
    };
    setResult(submitted);
    saveDraft(staffId, month, {
      salesAmount,
      salesTarget,
      selections,
      notes,
      submitted,
    });
  }

  function handleReset() {
    setSalesAmount(0);
    setSalesTarget(0);
    setSelections({ ...BLANK_SELECTIONS });
    setNotes("");
    setResult(undefined);
  }

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.35em] text-gold/70">
              Prototype V1 · Hunter
            </div>
            <h1 className="font-display text-xl font-semibold uppercase tracking-widest text-gold">
              Monthly Review
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              One review per team member per month. Enter sales, select the behaviour
              that best matches the month, then submit. The system calculates the
              Behaviour Score, Objective Score, Final Monthly Performance, and Monthly
              Grade automatically.
            </p>
          </div>
          <Link
            to="/"
            className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
          >
            ← Dashboard
          </Link>
        </header>

        <section className="mb-6 rounded-md border border-gold/30 bg-gold/5 p-4 text-xs text-gold/90">
          <div className="font-display uppercase tracking-[0.25em] text-gold">
            Evaluation Philosophy
          </div>
          <p className="mt-2 text-muted-foreground">
            Managers judge behaviour. The system calculates performance. Do not invent
            numbers — pick the behaviour description that best represents the
            team member's month.
          </p>
        </section>

        {!canReview ? (
          <div className="rounded-md border border-border bg-ink/30 p-5 text-xs text-muted-foreground">
            Only Managers and Directors can complete a Monthly Review.
          </div>
        ) : (
          <>
            {/* Step 0 — target */}
            <section className="mb-6 grid gap-3 rounded-md border border-border bg-ink/30 p-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Team Member (Hunter)
                </span>
                <select
                  className="w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                >
                  <option value="">— Select team member —</option>
                  {staff.map((s: any) => (
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

            {/* Step 1 — Sales entry */}
            <section className="mb-6 rounded-md border border-border bg-ink/30 p-5">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full border border-gold/50 px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.25em] text-gold">
                  Step 1
                </span>
                <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">
                  Sales
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the team member's total sales this month and their agreed target.
                This is data entry only.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                    Sales this month
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    disabled={!staffId}
                    value={salesAmount || ""}
                    placeholder="0"
                    onChange={(e) => setSalesAmount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none disabled:opacity-50"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                    Monthly sales target
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    disabled={!staffId}
                    value={salesTarget || ""}
                    placeholder="0"
                    onChange={(e) => setSalesTarget(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none disabled:opacity-50"
                  />
                </label>
              </div>
            </section>

            {/* Step 2 — Behaviour selection */}
            <section className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full border border-gold/50 px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.25em] text-gold">
                  Step 2
                </span>
                <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">
                  Behaviour
                </h2>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                Select the one description in each category that best represents the
                team member's behaviour throughout the month.
              </p>
              <div className="space-y-4">
                {CATEGORIES.map((cat) => (
                  <CategoryCard
                    key={cat.key}
                    category={cat}
                    selectedIndex={selections[cat.key]}
                    onSelect={(i) => selectOption(cat.key, i)}
                    disabled={!staffId}
                  />
                ))}
              </div>
            </section>

            {/* Step 3 — Optional notes */}
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
                Optional. Add notes only for exceptional performance or performance that
                needs recovery. Leave blank for a normal month.
              </p>
              <textarea
                rows={3}
                disabled={!staffId}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional — only for exceptional or poor performance."
                className="mt-3 w-full resize-none rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none disabled:opacity-50"
              />
            </section>

            {/* Submit + Result */}
            <section className="rounded-md border border-gold/30 bg-gold/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  {canSubmit
                    ? "Ready to submit — the system will calculate the final performance."
                    : !staffId
                    ? "Select a team member to begin."
                    : !salesReady
                    ? "Enter a sales target before submitting."
                    : "Select a behaviour description in every category."}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    disabled={!staffId}
                    className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-red-400/40 hover:text-red-200 disabled:opacity-50"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="rounded-md border border-gold bg-gold/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-gold hover:bg-gold/20 disabled:opacity-50"
                  >
                    Submit Monthly Review
                  </button>
                </div>
              </div>

              {result && <ResultPanel result={result} />}
            </section>

            <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              Prototype only · saved to this device · calculation preview
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Category card — behaviour picker (radio group, one selection)
// -------------------------------------------------------------------

function CategoryCard({
  category,
  selectedIndex,
  onSelect,
  disabled,
}: {
  category: Category;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  disabled: boolean;
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
        {category.options.map((opt, i) => {
          const active = selectedIndex === i;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(i)}
                className={`flex w-full items-start gap-3 rounded-md border px-3 py-2 text-left text-sm transition disabled:opacity-50 ${
                  active
                    ? "border-gold bg-gold/10 text-foreground"
                    : "border-border bg-black/20 text-muted-foreground hover:border-gold/40 hover:text-foreground"
                }`}
              >
                <span
                  className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    active ? "border-gold" : "border-border"
                  }`}
                >
                  {active && <span className="h-2 w-2 rounded-full bg-gold" />}
                </span>
                <span className="flex-1">{opt.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

// -------------------------------------------------------------------
// Result panel — calculated summary after submit
// -------------------------------------------------------------------

function ResultPanel({ result }: { result: NonNullable<Draft["submitted"]> }) {
  const g = gradeFor(result.finalScore);
  return (
    <div className="mt-5 grid gap-3 border-t border-gold/30 pt-5 sm:grid-cols-4">
      <Stat label="Behaviour Score" value={result.behaviourScore} suffix="/ 100" />
      <Stat label="Objective Score" value={result.objectiveScore} suffix="/ 100" />
      <Stat label="Final Performance" value={result.finalScore} suffix="/ 100" accent />
      <div className="rounded-md border p-3 text-center" style={{ borderColor: g.color }}>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Monthly Grade
        </div>
        <div className="mt-1 font-display text-2xl font-bold" style={{ color: g.color }}>
          {g.grade}
        </div>
        <div className="text-[10px] uppercase tracking-widest" style={{ color: g.color }}>
          {g.label}
        </div>
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
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {suffix}
        </div>
      )}
    </div>
  );
}
